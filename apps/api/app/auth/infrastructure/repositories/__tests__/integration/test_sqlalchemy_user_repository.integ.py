"""Tests d'integration du SqlAlchemyUserRepository contre un Postgres reel."""

import time
from collections.abc import AsyncIterator, Iterator
from pathlib import Path
from uuid import uuid4

import pytest
from alembic.config import Config
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from testcontainers.postgres import PostgresContainer

from alembic import command
from app.auth.domain.entities.user import User
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.value_objects.email import Email
from app.auth.infrastructure.repositories.sqlalchemy_user_repository import (
    SqlAlchemyUserRepository,
)

# repositories/__tests__/integration -> repositories -> infrastructure -> auth -> app -> apps/api
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
def postgres_url() -> Iterator[str]:
    container = PostgresContainer("postgres:16-alpine", driver="asyncpg")
    container.start()
    try:
        _wait_for_port(container, 5432)
        url = container.get_connection_url()
        config = Config(str(_API_ROOT / "alembic.ini"))
        config.set_main_option("script_location", str(_API_ROOT / "alembic"))
        config.set_main_option("sqlalchemy.url", url)
        command.upgrade(config, "head")
        yield url
    finally:
        container.stop()


@pytest.fixture
async def session(postgres_url: str) -> AsyncIterator[AsyncSession]:
    engine = create_async_engine(postgres_url)
    factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with factory() as opened:
        yield opened
    await engine.dispose()


def _new_user(email: str = "user@stacknest.local") -> User:
    return User(
        id=uuid4(),
        email=Email(email),
        password_hash="$2b$12$hash",
        role=UserRole.USER,
        is_verified=False,
        token_version=0,
    )


class TestAddAndGet:
    async def test_add_puis_get_by_email(self, session: AsyncSession) -> None:
        repository = SqlAlchemyUserRepository(session)
        user = _new_user("add-email@stacknest.local")

        await repository.add(user)
        await session.commit()

        found = await repository.get_by_email(Email("add-email@stacknest.local"))
        assert found is not None
        assert found.email == Email("add-email@stacknest.local")

    async def test_add_puis_get_by_id(self, session: AsyncSession) -> None:
        repository = SqlAlchemyUserRepository(session)
        user = _new_user("add-id@stacknest.local")

        await repository.add(user)
        await session.commit()

        found = await repository.get_by_id(user.id)
        assert found is not None
        assert found.id == user.id


class TestGetMisses:
    async def test_get_by_email_inconnu_renvoie_none(self, session: AsyncSession) -> None:
        repository = SqlAlchemyUserRepository(session)

        assert await repository.get_by_email(Email("inconnu@stacknest.local")) is None

    async def test_get_by_id_inconnu_renvoie_none(self, session: AsyncSession) -> None:
        repository = SqlAlchemyUserRepository(session)

        assert await repository.get_by_id(uuid4()) is None


class TestUpdate:
    async def test_update_persiste_les_modifications(self, session: AsyncSession) -> None:
        repository = SqlAlchemyUserRepository(session)
        user = _new_user("update@stacknest.local")
        await repository.add(user)
        await session.commit()

        user.is_verified = True
        user.token_version = 2
        await repository.update(user)
        await session.commit()

        found = await repository.get_by_id(user.id)
        assert found is not None
        assert found.is_verified is True
        assert found.token_version == 2
