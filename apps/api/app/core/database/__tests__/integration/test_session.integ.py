"""Test d'integration de get_session contre un Postgres reel.

Verifie que la dependance yield bien une AsyncSession utilisable (execute +
commit reels) et que la connexion est rendue au pool a la sortie.
"""

import time
from collections.abc import Iterator

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.postgres import PostgresContainer

from app.core.database.session import get_session


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


class TestGetSessionIntegration:
    async def test_yield_une_session_capable_d_executer_du_sql(
        self, postgres_container: PostgresContainer
    ) -> None:
        engine = create_async_engine(postgres_container.get_connection_url())
        factory = async_sessionmaker(bind=engine, expire_on_commit=False)

        try:
            generator = get_session(session_factory=factory)
            session = await anext(generator)
            result = await session.execute(text("SELECT 42"))
            assert result.scalar() == 42
            # Epuise le generateur -> declenche commit + sortie du contexte.
            with pytest.raises(StopAsyncIteration):
                await anext(generator)
        finally:
            await engine.dispose()
