"""Tests d'integration Alembic contre un Postgres reel (testcontainers).

Couvre :
- CA3 : `alembic upgrade head` sur une base vide applique la migration
  initiale (table `alembic_version` creee) et `alembic heads` renvoie
  exactement une revision (un seul head).
- CA4 : avec un modele ORM de test heritant de Base, `revision
  --autogenerate` detecte la table et produit un upgrade()/downgrade()
  symetrique (preuve que target_metadata est bien cable sur Base.metadata).
"""

import os
import time
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import Mapped, mapped_column
from testcontainers.postgres import PostgresContainer

from app.core.database.base import Base

# Racine apps/api (4 niveaux au-dessus de ce fichier de test :
# integration/ -> __tests__/ -> database/ -> core/ -> app/ -> apps/api).
_API_ROOT = Path(__file__).resolve().parents[5]


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
    container = PostgresContainer(
        "postgres:16-alpine", driver="asyncpg"
    )
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


class TestAlembicUpgrade:
    async def test_upgrade_head_cree_la_table_de_version(
        self, postgres_container: PostgresContainer
    ) -> None:
        url = postgres_container.get_connection_url()
        config = _alembic_config(url)

        command.upgrade(config, "head")

        engine = create_async_engine(url)
        async with engine.connect() as connection:
            result = await connection.execute(
                text(
                    "SELECT to_regclass('public.alembic_version') IS NOT NULL"
                )
            )
            assert result.scalar() is True
        await engine.dispose()

    def test_un_seul_head(self) -> None:
        script = ScriptDirectory(str(_API_ROOT / "alembic"))

        heads = script.get_heads()

        assert len(heads) == 1


class TestAlembicAutogenerate:
    async def test_autogenerate_detecte_un_modele_heritant_de_base(
        self, postgres_container: PostgresContainer, tmp_path: Path
    ) -> None:
        url = postgres_container.get_connection_url()

        # Modele ORM de test, declare a la volee (jamais persiste en versions/).
        class _AutogenProbe(Base):
            __tablename__ = "stn160_autogen_probe"
            id: Mapped[int] = mapped_column(primary_key=True)
            label: Mapped[str] = mapped_column()

        try:
            config = _alembic_config(url)
            command.upgrade(config, "head")

            # Genere une revision dans un dossier temporaire isole pour ne pas
            # polluer alembic/versions/ du repo. On AJOUTE ce dossier aux
            # version_locations (sans retirer celui du repo) afin qu'Alembic
            # resolve toujours la baseline (down_revision de la nouvelle rev).
            versions_dir = tmp_path / "versions"
            versions_dir.mkdir()
            repo_versions = _API_ROOT / "alembic" / "versions"
            config.set_main_option(
                "version_locations", f"{repo_versions}{os.pathsep}{versions_dir}"
            )
            command.revision(
                config,
                message="autogen probe",
                autogenerate=True,
                version_path=str(versions_dir),
            )

            generated = next(versions_dir.glob("*.py"))
            content = generated.read_text(encoding="utf-8")
            # upgrade()/downgrade() symetriques sur la table detectee. Le hook
            # ruff reformate en guillemets doubles -> on assert sans guillemet.
            assert "op.create_table(" in content
            assert "stn160_autogen_probe" in content
            assert "op.drop_table(" in content
            # La naming convention de Base s'applique : PK nommee via op.f().
            assert "pk_stn160_autogen_probe" in content
        finally:
            Base.metadata.remove(_AutogenProbe.__table__)
