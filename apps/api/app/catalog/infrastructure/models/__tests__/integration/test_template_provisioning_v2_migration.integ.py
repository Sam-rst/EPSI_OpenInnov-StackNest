"""Tests d'integration de la migration `provisioning v2` (templates) sur Postgres reel.

Couvre, contre un Postgres reel (testcontainers) :
- `upgrade head` ajoute les 3 colonnes (`command`, `secret_value_template`,
  `is_deployable`) a `templates` et laisse un head unique (pas de branche).
- un cycle `downgrade -1` (retire les 3 colonnes) puis `upgrade head` est rejouable :
  preuve que le downgrade est symetrique.
"""

import time
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from testcontainers.postgres import PostgresContainer

from alembic import command

# integration/ -> __tests__/ -> models/ -> infrastructure/ -> catalog/ -> app/ -> apps/api
_API_ROOT = Path(__file__).resolve().parents[6]

_V2_REVISION = "b2c3d4e5f6a7"
_TABLE = "templates"
_NEW_COLUMNS = {"command", "secret_value_template", "is_deployable"}


def _wait_for_port(container: PostgresContainer, port: int, timeout: float = 60.0) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            container.get_exposed_port(port)
            return
        except (ConnectionError, ValueError, TypeError):
            time.sleep(0.3)
    raise TimeoutError(f"Port {port} not exposed within {timeout}s")


@pytest.fixture(scope="module")
def postgres_container() -> Iterator[PostgresContainer]:
    container = PostgresContainer("postgres:16-alpine", driver="asyncpg")
    container.start()
    try:
        _wait_for_port(container, 5432)
        yield container
    finally:
        container.stop()


def _alembic_config(database_url: str) -> Config:
    config = Config(str(_API_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(_API_ROOT / "alembic"))
    config.set_main_option("sqlalchemy.url", database_url)
    return config


async def _columns(database_url: str, table: str) -> set[str]:
    engine = create_async_engine(database_url)
    try:
        async with engine.connect() as connection:
            result = await connection.execute(
                text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_schema = 'public' AND table_name = :table"
                ),
                {"table": table},
            )
            return {row[0] for row in result.fetchall()}
    finally:
        await engine.dispose()


class TestProvisioningV2MigrationHead:
    def test_un_seul_head(self) -> None:
        script = ScriptDirectory(str(_API_ROOT / "alembic"))

        assert len(script.get_heads()) == 1

    async def test_upgrade_head_ajoute_les_trois_colonnes(
        self, postgres_container: PostgresContainer
    ) -> None:
        url = postgres_container.get_connection_url()
        config = _alembic_config(url)

        command.upgrade(config, "head")

        columns = await _columns(url, _TABLE)
        assert columns >= _NEW_COLUMNS


class TestProvisioningV2MigrationDowngrade:
    async def test_cycle_downgrade_puis_upgrade_est_rejouable(
        self, postgres_container: PostgresContainer
    ) -> None:
        url = postgres_container.get_connection_url()
        config = _alembic_config(url)

        command.upgrade(config, "head")
        # Annule uniquement l'ajout des 3 colonnes (revient sur la migration precedente).
        command.downgrade(config, f"{_V2_REVISION}-1")

        columns_apres_downgrade = await _columns(url, _TABLE)
        assert _NEW_COLUMNS.isdisjoint(columns_apres_downgrade)

        # Rejouable : aucune erreur (colonnes deja existantes / absentes).
        command.upgrade(config, "head")
        columns_apres_reupgrade = await _columns(url, _TABLE)
        assert columns_apres_reupgrade >= _NEW_COLUMNS
