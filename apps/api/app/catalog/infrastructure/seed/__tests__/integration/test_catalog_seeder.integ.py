"""Tests d'integration du CatalogSeeder convergent contre un Postgres reel.

Demarre un conteneur Postgres (testcontainers), applique la migration socle puis
exerce le seeder en upsert : insertion initiale, puis re-seed d'un template
evolue (env_var modifie + param ajoute). Verifie que l'identite du template reste
stable (meme id) et que l'etat persiste converge vers la nouvelle definition,
sans duplication. Un re-seed identique est un no-op.
"""

import time
from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from testcontainers.postgres import PostgresContainer

from alembic import command
from app.catalog.application.commands.template_command import ParamSpec, TemplateCommand
from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.param_type import ParamType
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.domain.value_objects.slug import Slug
from app.catalog.infrastructure.repositories.sqlalchemy_template_repository import (
    SqlAlchemyTemplateRepository,
)
from app.catalog.infrastructure.seed.catalog_seeder import CatalogSeeder

# integration/ -> __tests__/ -> seed/ -> infrastructure/ -> catalog/ -> app/ -> apps/api
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


def _command(
    *,
    slug: str,
    params: list[ParamSpec],
    image_repository: str | None = None,
    internal_port: int | None = None,
    secret_env: str | None = None,
    command: list[str] | None = None,
    secret_value_template: str | None = None,
    is_deployable: bool = True,
) -> TemplateCommand:
    return TemplateCommand(
        slug=slug,
        name="PostgreSQL",
        icon="database",
        category=TemplateCategory.DATABASE,
        provider="Docker",
        description="Base relationnelle managee.",
        popular=True,
        tags=["SQL"],
        is_active=True,
        engine=EngineKind.DOCKER,
        params=params,
        image_repository=image_repository,
        internal_port=internal_port,
        secret_env=secret_env,
        command=command,
        secret_value_template=secret_value_template,
        is_deployable=is_deployable,
    )


def _param(*, key: str = "database", env_var: str | None) -> ParamSpec:
    return ParamSpec(
        key=key,
        label="Nom de la base",
        type=ParamType.STRING,
        required=False,
        default_value="app",
        options=None,
        order_index=1,
        env_var=env_var,
    )


class TestSeederConvergence:
    async def test_reseed_actualise_en_place_avec_id_stable(self, session: AsyncSession) -> None:
        repository = SqlAlchemyTemplateRepository(session)
        seeder = CatalogSeeder(repository)
        slug = Slug("seed-pg-convergent")

        first = await seeder.seed(
            dataset=[_command(slug=slug.value, params=[_param(env_var=None)])]
        )
        await session.commit()
        original = await repository.get_by_slug(slug)
        assert original is not None
        assert first.inserted == 1
        original_id = original.id

        second = await seeder.seed(
            dataset=[
                _command(
                    slug=slug.value,
                    params=[
                        _param(env_var="POSTGRES_DB"),
                        _param(key="schema", env_var="POSTGRES_SCHEMA"),
                    ],
                )
            ]
        )
        await session.commit()

        assert second.inserted == 0
        assert second.updated == 1
        updated = await repository.get_by_slug(slug)
        assert updated is not None
        assert updated.id == original_id, "l'identite du template doit rester stable"
        by_key = {param.key: param for param in updated.params}
        assert by_key["database"].env_var == "POSTGRES_DB"
        assert by_key["schema"].env_var == "POSTGRES_SCHEMA"
        # Pas de duplication : un seul template porte ce slug.
        assert len([t for t in await repository.list_all() if str(t.slug) == slug.value]) == 1

    async def test_reseed_actualise_les_champs_niveau_template(self, session: AsyncSession) -> None:
        """Les champs scalaires niveau-template convergent via update (vrai repo).

        Regression : `_apply_scalar_fields` omettait image_repository / internal_port
        / secret_env et les champs v2 (command / secret_value_template /
        is_deployable) -> un update convergent ne les actualisait jamais en base.
        """
        repository = SqlAlchemyTemplateRepository(session)
        seeder = CatalogSeeder(repository)
        slug = Slug("seed-scalars-convergent")

        await seeder.seed(dataset=[_command(slug=slug.value, params=[_param(env_var=None)])])
        await session.commit()

        outcome = await seeder.seed(
            dataset=[
                _command(
                    slug=slug.value,
                    params=[_param(env_var=None)],
                    image_repository="keycloak",
                    internal_port=8080,
                    secret_env="KEYCLOAK_ADMIN_PASSWORD",
                    command=["start-dev"],
                    secret_value_template="neo4j/{secret}",
                    is_deployable=False,
                )
            ]
        )
        await session.commit()

        assert outcome.updated == 1
        updated = await repository.get_by_slug(slug)
        assert updated is not None
        assert updated.image_repository == "keycloak"
        assert updated.internal_port == 8080
        assert updated.secret_env == "KEYCLOAK_ADMIN_PASSWORD"
        assert updated.command == ["start-dev"]
        assert updated.secret_value_template == "neo4j/{secret}"
        assert updated.is_deployable is False

    async def test_reseed_identique_est_un_no_op(self, session: AsyncSession) -> None:
        repository = SqlAlchemyTemplateRepository(session)
        seeder = CatalogSeeder(repository)
        dataset = [_command(slug="seed-pg-noop", params=[_param(env_var="POSTGRES_DB")])]

        await seeder.seed(dataset=dataset)
        await session.commit()
        again = await seeder.seed(dataset=dataset)
        await session.commit()

        assert again.inserted == 0
        assert again.updated == 0
