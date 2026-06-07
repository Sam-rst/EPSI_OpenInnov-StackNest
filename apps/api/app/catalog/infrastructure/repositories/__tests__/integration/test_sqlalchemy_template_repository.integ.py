"""Tests d'integration du SqlAlchemyTemplateRepository contre un Postgres reel.

Demarre un conteneur Postgres (testcontainers), applique la migration socle
(`alembic upgrade head`) puis exerce le repository sur un round-trip complet :
creation d'un agregat (template + versions + params), relecture par id et par
slug, mise a jour (remplacement des versions/params) et suppression (cascade).
"""

import time
from collections.abc import AsyncIterator, Iterator
from datetime import date
from pathlib import Path
from uuid import uuid4

import pytest
from alembic.config import Config
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from testcontainers.postgres import PostgresContainer

from alembic import command
from app.catalog.domain.entities.template import Template
from app.catalog.domain.entities.template_param import TemplateParam
from app.catalog.domain.entities.template_version import TemplateVersion
from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.param_type import ParamType
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.domain.value_objects.slug import Slug
from app.catalog.infrastructure.repositories.sqlalchemy_template_repository import (
    SqlAlchemyTemplateRepository,
)

# integration/ -> __tests__/ -> repositories/ -> infrastructure/ -> catalog/ ->
# app/ -> apps/api
_API_ROOT = Path(__file__).resolve().parents[6]


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
        url = container.get_connection_url()
        config = Config(str(_API_ROOT / "alembic.ini"))
        config.set_main_option("script_location", str(_API_ROOT / "alembic"))
        config.set_main_option("sqlalchemy.url", url)
        command.upgrade(config, "head")
        yield container
    finally:
        container.stop()


@pytest.fixture
async def session(postgres_container: PostgresContainer) -> AsyncIterator[AsyncSession]:
    engine = create_async_engine(postgres_container.get_connection_url())
    factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with factory() as opened:
        yield opened
        await opened.rollback()
    await engine.dispose()


def _template(
    slug: str = "postgresql-16",
    *,
    engine: EngineKind = EngineKind.DOCKER,
    image_repository: str | None = None,
    internal_port: int | None = None,
    secret_env: str | None = None,
) -> Template:
    return Template(
        id=uuid4(),
        slug=Slug(slug),
        name="PostgreSQL",
        icon="database",
        category=TemplateCategory.DATABASE,
        provider="Docker",
        description="Base relationnelle managee.",
        popular=True,
        tags=["SQL", "Persistant"],
        is_active=True,
        engine=engine,
        image_repository=image_repository,
        internal_port=internal_port,
        secret_env=secret_env,
        versions=[
            TemplateVersion(
                id=uuid4(), version="16", is_default=True, is_lts=False, eol_date=date(2028, 11, 9)
            ),
            TemplateVersion(
                id=uuid4(), version="15", is_default=False, is_lts=True, eol_date=date(2027, 11, 11)
            ),
        ],
        params=[
            TemplateParam(
                id=uuid4(),
                key="db_name",
                label="Nom de la base",
                type=ParamType.STRING,
                required=True,
                default_value="app",
                options=None,
                order_index=0,
            ),
            TemplateParam(
                id=uuid4(),
                key="size",
                label="Taille",
                type=ParamType.SELECT,
                required=False,
                default_value="small",
                options={"choices": ["small", "medium", "large"]},
                order_index=1,
            ),
        ],
    )


class TestAddAndGet:
    async def test_add_puis_get_by_id_recharge_l_agregat(self, session: AsyncSession) -> None:
        repository = SqlAlchemyTemplateRepository(session)

        created = await repository.add(_template())
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert str(reloaded.slug) == "postgresql-16"
        assert len(reloaded.versions) == 2
        assert len(reloaded.params) == 2
        assert reloaded.created_at is not None

    async def test_get_by_slug_trouve_le_template(self, session: AsyncSession) -> None:
        repository = SqlAlchemyTemplateRepository(session)
        await repository.add(_template(slug="redis-7"))
        await session.commit()

        found = await repository.get_by_slug(Slug("redis-7"))
        assert found is not None
        assert str(found.slug) == "redis-7"

    async def test_get_by_id_inconnu_renvoie_none(self, session: AsyncSession) -> None:
        repository = SqlAlchemyTemplateRepository(session)

        assert await repository.get_by_id(uuid4()) is None

    async def test_descripteur_de_provisioning_persiste(self, session: AsyncSession) -> None:
        repository = SqlAlchemyTemplateRepository(session)

        created = await repository.add(
            _template(
                slug="elk",
                image_repository="postgres",
                internal_port=5432,
                secret_env="POSTGRES_PASSWORD",
            )
        )
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert reloaded.image_repository == "postgres"
        assert reloaded.internal_port == 5432
        assert reloaded.secret_env == "POSTGRES_PASSWORD"

    async def test_descripteur_de_provisioning_nullable(self, session: AsyncSession) -> None:
        repository = SqlAlchemyTemplateRepository(session)

        created = await repository.add(_template(slug="vpc"))
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert reloaded.image_repository is None
        assert reloaded.internal_port is None
        assert reloaded.secret_env is None


class TestEngine:
    async def test_engine_terraform_persiste(self, session: AsyncSession) -> None:
        repository = SqlAlchemyTemplateRepository(session)

        created = await repository.add(_template(slug="ubuntu-24-04", engine=EngineKind.TERRAFORM))
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert reloaded.engine is EngineKind.TERRAFORM

    async def test_engine_docker_par_defaut(self, session: AsyncSession) -> None:
        repository = SqlAlchemyTemplateRepository(session)

        created = await repository.add(_template(slug="python-3-13"))
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert reloaded.engine is EngineKind.DOCKER


class TestListAll:
    async def test_list_all_renvoie_des_cartes_legeres(self, session: AsyncSession) -> None:
        repository = SqlAlchemyTemplateRepository(session)
        await repository.add(_template(slug="minio"))
        await session.commit()

        templates = await repository.list_all()
        assert any(str(t.slug) == "minio" for t in templates)


class TestUpdate:
    async def test_update_remplace_versions_et_params(self, session: AsyncSession) -> None:
        repository = SqlAlchemyTemplateRepository(session)
        created = await repository.add(_template(slug="node-20"))
        await session.commit()

        mutated = Template(
            id=created.id,
            slug=Slug("node-20"),
            name="Node.js renomme",
            icon="box",
            category=TemplateCategory.RUNTIME,
            provider="Docker",
            description="Image Node LTS.",
            popular=False,
            tags=["Runtime"],
            is_active=True,
            versions=[
                TemplateVersion(
                    id=uuid4(), version="20", is_default=True, is_lts=True, eol_date=None
                )
            ],
            params=[],
        )
        await repository.update(mutated)
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert reloaded.name == "Node.js renomme"
        assert len(reloaded.versions) == 1
        assert reloaded.params == []


class TestDelete:
    async def test_delete_supprime_le_template_en_cascade(self, session: AsyncSession) -> None:
        repository = SqlAlchemyTemplateRepository(session)
        created = await repository.add(_template(slug="vault"))
        await session.commit()

        await repository.delete(created.id)
        await session.commit()

        assert await repository.get_by_id(created.id) is None
