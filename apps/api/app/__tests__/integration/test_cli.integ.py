"""Test d'integration de la CLI create-admin contre un Postgres reel.

Exerce `create_admin_account` avec un repository SQLAlchemy adosse a un
Postgres de test (migrations Alembic appliquees), puis verifie que l'admin est
bien persiste (role admin, compte verifie, hash bcrypt verifiable).
"""

import time
from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from testcontainers.postgres import PostgresContainer

from alembic import command
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.value_objects.email import Email
from app.auth.domain.value_objects.password import Password
from app.auth.infrastructure.repositories.sqlalchemy_user_repository import (
    SqlAlchemyUserRepository,
)
from app.auth.infrastructure.security.bcrypt_password_hasher import BcryptPasswordHasher
from app.cli import create_admin_account

# __tests__/integration -> __tests__ -> app -> apps/api
_API_ROOT = Path(__file__).resolve().parents[3]


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


class TestCreateAdminAccountIntegration:
    async def test_persiste_un_admin_verifie(self, session: AsyncSession) -> None:
        repository = SqlAlchemyUserRepository(session)
        hasher = BcryptPasswordHasher()

        await create_admin_account(
            email="cli-admin@stacknest.local",
            password="adminpass1",
            repository=repository,
            hasher=hasher,
        )
        await session.commit()

        found = await repository.get_by_email(Email("cli-admin@stacknest.local"))
        assert found is not None
        assert found.role is UserRole.ADMIN
        assert found.is_verified is True
        assert hasher.verify(Password("adminpass1"), found.password_hash) is True
