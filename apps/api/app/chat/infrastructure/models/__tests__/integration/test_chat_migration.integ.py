"""Tests d'integration de la migration Chat IA contre un Postgres reel.

Couvre, contre un Postgres reel (testcontainers) :
- `upgrade head` cree les 3 tables chat (conversations, messages, chat_actions)
  et laisse un head unique.
- un cycle `downgrade -1` (annule la migration chat) puis `upgrade head` est
  rejouable : preuve que le downgrade est symetrique (enums Postgres incluses).
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

# integration/ -> __tests__/ -> models/ -> infrastructure/ -> chat/ -> app/ -> apps/api
_API_ROOT = Path(__file__).resolve().parents[6]

_TABLES_CHAT = {"conversations", "messages", "chat_actions"}
_CHAT_REVISION = "c4e1a2b3d5f6"


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


async def _existing_tables(database_url: str) -> set[str]:
    engine = create_async_engine(database_url)
    try:
        async with engine.connect() as connection:
            result = await connection.execute(
                text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                )
            )
            return {row[0] for row in result.fetchall()}
    finally:
        await engine.dispose()


class TestChatMigrationHead:
    def test_un_seul_head(self) -> None:
        script = ScriptDirectory(str(_API_ROOT / "alembic"))

        assert len(script.get_heads()) == 1

    async def test_upgrade_head_cree_les_tables_chat(
        self, postgres_container: PostgresContainer
    ) -> None:
        url = postgres_container.get_connection_url()
        config = _alembic_config(url)

        command.upgrade(config, "head")

        tables = await _existing_tables(url)
        assert tables >= _TABLES_CHAT


class TestChatMigrationDowngrade:
    async def test_cycle_downgrade_puis_upgrade_est_rejouable(
        self, postgres_container: PostgresContainer
    ) -> None:
        url = postgres_container.get_connection_url()
        config = _alembic_config(url)

        command.upgrade(config, "head")
        # Annule uniquement la migration chat (revient sur la table deployments).
        command.downgrade(config, f"{_CHAT_REVISION}-1")

        tables_apres_downgrade = await _existing_tables(url)
        assert _TABLES_CHAT.isdisjoint(tables_apres_downgrade)

        # Rejouable : aucune erreur de type enum deja existant.
        command.upgrade(config, "head")
        tables_apres_reupgrade = await _existing_tables(url)
        assert tables_apres_reupgrade >= _TABLES_CHAT
