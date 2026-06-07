"""Tests d'integration du SqlAlchemyDeploymentRepository contre un Postgres reel.

Demarre un conteneur Postgres (testcontainers), applique les migrations
(`alembic upgrade head`, table `deployments` incluse) puis exerce le repository
sur un round-trip complet : creation (`add`) puis relecture (`get_by_id`),
isolation par proprietaire (`list_by_owner`) et mise a jour du cycle de vie
(`update` : statut, host, port).

Les FK `owner_id -> users.id` et `template_id -> templates.id` imposent qu'un
utilisateur et un template existent au prealable : ils sont semes par fixture.
"""

import time
from collections.abc import AsyncIterator, Iterator
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic.config import Config
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from testcontainers.postgres import PostgresContainer

from alembic import command
from app.auth.infrastructure.models.user_model import UserModel
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.infrastructure.models.template_model import TemplateModel
from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.infrastructure.repositories.sqlalchemy_deployment_repository import (
    SqlAlchemyDeploymentRepository,
)

# integration/ -> __tests__/ -> repositories/ -> infrastructure/ -> deployment/
# -> app/ -> apps/api
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


async def _seed_user(session: AsyncSession) -> UUID:
    user = UserModel(
        id=uuid4(),
        email=f"user-{uuid4().hex}@stacknest.test",
        password_hash="hash",
    )
    session.add(user)
    await session.flush()
    return user.id


async def _seed_template(session: AsyncSession) -> UUID:
    template = TemplateModel(
        id=uuid4(),
        slug=f"template-{uuid4().hex}",
        name="PostgreSQL",
        icon="database",
        category=TemplateCategory.DATABASE,
        provider="Docker",
        description="Base relationnelle managee.",
    )
    session.add(template)
    await session.flush()
    return template.id


def _deployment(
    *,
    owner_id: UUID,
    template_id: UUID,
    name: str = "ma-base",
    status: DeploymentStatus = DeploymentStatus.PENDING,
) -> Deployment:
    return Deployment(
        id=uuid4(),
        owner_id=owner_id,
        template_id=template_id,
        template_version="16",
        name=name,
        status=status,
        params={"db_name": "app"},
    )


class TestAddAndGet:
    async def test_add_puis_get_by_id_recharge_le_deploiement(self, session: AsyncSession) -> None:
        repository = SqlAlchemyDeploymentRepository(session)
        owner_id = await _seed_user(session)
        template_id = await _seed_template(session)

        created = await repository.add(_deployment(owner_id=owner_id, template_id=template_id))
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert reloaded.owner_id == owner_id
        assert reloaded.template_id == template_id
        assert reloaded.template_version == "16"
        assert reloaded.name == "ma-base"
        assert reloaded.status is DeploymentStatus.PENDING
        assert reloaded.params == {"db_name": "app"}
        assert reloaded.host is None
        assert reloaded.published_port is None
        assert reloaded.created_at is not None
        assert reloaded.updated_at is not None

    async def test_get_by_id_inconnu_renvoie_none(self, session: AsyncSession) -> None:
        repository = SqlAlchemyDeploymentRepository(session)

        assert await repository.get_by_id(uuid4()) is None


class TestListByOwner:
    async def test_list_by_owner_isole_par_proprietaire(self, session: AsyncSession) -> None:
        repository = SqlAlchemyDeploymentRepository(session)
        owner_id = await _seed_user(session)
        other_owner_id = await _seed_user(session)
        template_id = await _seed_template(session)

        await repository.add(_deployment(owner_id=owner_id, template_id=template_id, name="a"))
        await repository.add(_deployment(owner_id=owner_id, template_id=template_id, name="b"))
        await repository.add(
            _deployment(owner_id=other_owner_id, template_id=template_id, name="c")
        )
        await session.commit()

        mine = await repository.list_by_owner(owner_id)
        assert {d.name for d in mine} == {"a", "b"}
        assert all(d.owner_id == owner_id for d in mine)

    async def test_list_by_owner_sans_deploiement_renvoie_vide(self, session: AsyncSession) -> None:
        repository = SqlAlchemyDeploymentRepository(session)

        assert await repository.list_by_owner(uuid4()) == []


class TestUpdate:
    async def test_update_modifie_statut_host_et_port(self, session: AsyncSession) -> None:
        repository = SqlAlchemyDeploymentRepository(session)
        owner_id = await _seed_user(session)
        template_id = await _seed_template(session)
        created = await repository.add(_deployment(owner_id=owner_id, template_id=template_id))
        await session.commit()

        created.status = DeploymentStatus.RUNNING
        created.host = "node-7"
        created.published_port = 54320
        await repository.update(created)
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert reloaded.status is DeploymentStatus.RUNNING
        assert reloaded.host == "node-7"
        assert reloaded.published_port == 54320

    async def test_update_renvoie_l_entite_mise_a_jour(self, session: AsyncSession) -> None:
        repository = SqlAlchemyDeploymentRepository(session)
        owner_id = await _seed_user(session)
        template_id = await _seed_template(session)
        created = await repository.add(_deployment(owner_id=owner_id, template_id=template_id))
        await session.commit()

        created.status = DeploymentStatus.PROVISIONING
        returned = await repository.update(created)

        assert returned.status is DeploymentStatus.PROVISIONING
