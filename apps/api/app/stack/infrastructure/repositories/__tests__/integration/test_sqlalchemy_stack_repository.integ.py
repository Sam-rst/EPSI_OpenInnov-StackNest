"""Tests d'integration du SqlAlchemyStackRepository contre un Postgres reel.

Demarre un conteneur Postgres (testcontainers), applique les migrations
(`alembic upgrade head`, tables stack incluses) puis exerce le repository :
- creation et relecture d'une stack (`add` / `get_by_id`) ;
- isolation par proprietaire (`list_by_owner`) ;
- persistance et relecture des services (ordonnes) et des liens ;
- contrainte d'unicite `(stack_id, alias)` ;
- suppression de la stack et cascade sur services et liens (`delete`).

Les FK `owner_id -> users.id` et `template_id -> templates.id` imposent qu'un
utilisateur et un template existent au prealable : ils sont semes par fixture.
"""

import time
from collections.abc import AsyncIterator, Iterator
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic.config import Config
from sqlalchemy.exc import IntegrityError
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
from app.stack.domain.entities.stack import Stack
from app.stack.domain.entities.stack_link import StackLink
from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.infrastructure.repositories.sqlalchemy_stack_repository import (
    SqlAlchemyStackRepository,
)

# integration/ -> __tests__/ -> repositories/ -> infrastructure/ -> stack/
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


def _stack(*, owner_id: UUID, name: str = "ma-stack") -> Stack:
    return Stack(id=uuid4(), owner_id=owner_id, name=name, status=StackStatus.PENDING)


def _service(
    *,
    stack_id: UUID,
    template_id: UUID,
    alias: str,
    order_index: int = 0,
) -> StackService:
    return StackService(
        id=uuid4(),
        stack_id=stack_id,
        template_id=template_id,
        version="16",
        alias=alias,
        service_status=ServiceStatus.PENDING,
        order_index=order_index,
        params={"POSTGRES_DB": "app"},
    )


class TestAddAndGet:
    async def test_add_puis_get_by_id_recharge_la_stack(self, session: AsyncSession) -> None:
        repository = SqlAlchemyStackRepository(session)
        owner_id = await _seed_user(session)

        created = await repository.add(_stack(owner_id=owner_id))
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert reloaded.owner_id == owner_id
        assert reloaded.name == "ma-stack"
        assert reloaded.status is StackStatus.PENDING
        assert reloaded.created_at is not None
        assert reloaded.updated_at is not None

    async def test_get_by_id_inconnu_renvoie_none(self, session: AsyncSession) -> None:
        repository = SqlAlchemyStackRepository(session)

        assert await repository.get_by_id(uuid4()) is None


class TestListByOwner:
    async def test_list_by_owner_isole_par_proprietaire(self, session: AsyncSession) -> None:
        repository = SqlAlchemyStackRepository(session)
        owner_id = await _seed_user(session)
        other_owner_id = await _seed_user(session)

        await repository.add(_stack(owner_id=owner_id, name="a"))
        await repository.add(_stack(owner_id=owner_id, name="b"))
        await repository.add(_stack(owner_id=other_owner_id, name="c"))
        await session.commit()

        mine = await repository.list_by_owner(owner_id)
        assert {s.name for s in mine} == {"a", "b"}
        assert all(s.owner_id == owner_id for s in mine)

    async def test_list_by_owner_sans_stack_renvoie_vide(self, session: AsyncSession) -> None:
        repository = SqlAlchemyStackRepository(session)

        assert await repository.list_by_owner(uuid4()) == []


class TestServices:
    async def test_add_services_puis_list_services_ordonne(self, session: AsyncSession) -> None:
        repository = SqlAlchemyStackRepository(session)
        owner_id = await _seed_user(session)
        template_id = await _seed_template(session)
        stack = await repository.add(_stack(owner_id=owner_id))
        await session.commit()

        await repository.add_service(
            _service(stack_id=stack.id, template_id=template_id, alias="api", order_index=1)
        )
        await repository.add_service(
            _service(stack_id=stack.id, template_id=template_id, alias="db", order_index=0)
        )
        await session.commit()

        services = await repository.list_services(stack.id)
        assert [s.alias for s in services] == ["db", "api"]
        assert services[0].params == {"POSTGRES_DB": "app"}
        assert all(s.stack_id == stack.id for s in services)

    async def test_alias_unique_par_stack(self, session: AsyncSession) -> None:
        repository = SqlAlchemyStackRepository(session)
        owner_id = await _seed_user(session)
        template_id = await _seed_template(session)
        stack = await repository.add(_stack(owner_id=owner_id))
        await session.commit()

        await repository.add_service(
            _service(stack_id=stack.id, template_id=template_id, alias="db")
        )
        await session.commit()

        with pytest.raises(IntegrityError):
            await repository.add_service(
                _service(stack_id=stack.id, template_id=template_id, alias="db")
            )

    async def test_meme_alias_dans_deux_stacks_distinctes(self, session: AsyncSession) -> None:
        repository = SqlAlchemyStackRepository(session)
        owner_id = await _seed_user(session)
        template_id = await _seed_template(session)
        stack_a = await repository.add(_stack(owner_id=owner_id, name="a"))
        stack_b = await repository.add(_stack(owner_id=owner_id, name="b"))
        await session.commit()

        await repository.add_service(
            _service(stack_id=stack_a.id, template_id=template_id, alias="db")
        )
        await repository.add_service(
            _service(stack_id=stack_b.id, template_id=template_id, alias="db")
        )
        await session.commit()

        assert len(await repository.list_services(stack_a.id)) == 1
        assert len(await repository.list_services(stack_b.id)) == 1


class TestLinks:
    async def test_add_link_puis_list_links(self, session: AsyncSession) -> None:
        repository = SqlAlchemyStackRepository(session)
        owner_id = await _seed_user(session)
        template_id = await _seed_template(session)
        stack = await repository.add(_stack(owner_id=owner_id))
        await session.commit()

        api = await repository.add_service(
            _service(stack_id=stack.id, template_id=template_id, alias="api", order_index=1)
        )
        db = await repository.add_service(
            _service(stack_id=stack.id, template_id=template_id, alias="db", order_index=0)
        )
        await session.commit()

        await repository.add_link(
            StackLink(
                id=uuid4(),
                stack_id=stack.id,
                from_service_id=api.id,
                to_service_id=db.id,
                var_mappings={"DB_HOST": "{to.alias}", "DB_PASSWORD": "{to.secret}"},
            )
        )
        await session.commit()

        links = await repository.list_links(stack.id)
        assert len(links) == 1
        assert links[0].from_service_id == api.id
        assert links[0].to_service_id == db.id
        assert links[0].var_mappings == {"DB_HOST": "{to.alias}", "DB_PASSWORD": "{to.secret}"}


class TestDelete:
    async def test_delete_supprime_la_stack_ses_services_et_liens(
        self, session: AsyncSession
    ) -> None:
        repository = SqlAlchemyStackRepository(session)
        owner_id = await _seed_user(session)
        template_id = await _seed_template(session)
        stack = await repository.add(_stack(owner_id=owner_id))
        await session.commit()

        api = await repository.add_service(
            _service(stack_id=stack.id, template_id=template_id, alias="api", order_index=1)
        )
        db = await repository.add_service(
            _service(stack_id=stack.id, template_id=template_id, alias="db", order_index=0)
        )
        await repository.add_link(
            StackLink(
                id=uuid4(),
                stack_id=stack.id,
                from_service_id=api.id,
                to_service_id=db.id,
            )
        )
        await session.commit()

        await repository.delete(stack.id)
        await session.commit()

        assert await repository.get_by_id(stack.id) is None
        # Cascade : services et liens de la stack ont disparu avec elle.
        assert await repository.list_services(stack.id) == []
        assert await repository.list_links(stack.id) == []
