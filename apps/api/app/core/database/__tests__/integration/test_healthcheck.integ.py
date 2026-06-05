"""Tests d'integration du healthcheck DB contre un Postgres reel.

Couvre CA5 :
- base up  -> check_database ne leve pas / DatabaseHealthCheck renvoie OK
- base down -> check_database leve DatabaseUnavailableException (exception
  infra typee, pas un crash brut) / l'adapter renvoie CheckResult DOWN.
"""

import time
from collections.abc import Iterator

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.postgres import PostgresContainer

from app.core.database.exceptions.database_unavailable_exception import (
    DatabaseUnavailableException,
)
from app.core.database.healthcheck import check_database
from app.health.domain.enums.check_status import CheckStatus
from app.health.infrastructure.database_health_check import DatabaseHealthCheck

# Port libre garanti injoignable (RFC 6335 dynamic range, rien n'ecoute).
_UNREACHABLE_URL = "postgresql+asyncpg://stacknest:stacknest@127.0.0.1:1/stacknest"


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


class TestCheckDatabaseIntegration:
    async def test_ne_leve_pas_quand_postgres_est_up(
        self, postgres_container: PostgresContainer
    ) -> None:
        engine = create_async_engine(postgres_container.get_connection_url())
        factory = async_sessionmaker(bind=engine, expire_on_commit=False)
        try:
            async with factory() as session:
                await check_database(session)  # ne doit pas lever
        finally:
            await engine.dispose()

    async def test_leve_exception_typee_quand_postgres_est_down(self) -> None:
        engine = create_async_engine(_UNREACHABLE_URL)
        factory = async_sessionmaker(bind=engine, expire_on_commit=False)
        try:
            with pytest.raises(DatabaseUnavailableException) as exc_info:
                async with factory() as session:
                    await check_database(session)
            assert exc_info.value.http_status == 503
        finally:
            await engine.dispose()


class TestDatabaseHealthCheckIntegration:
    async def test_renvoie_ok_quand_postgres_est_up(
        self, postgres_container: PostgresContainer
    ) -> None:
        engine = create_async_engine(postgres_container.get_connection_url())
        factory = async_sessionmaker(bind=engine, expire_on_commit=False)
        check = DatabaseHealthCheck(session_factory=factory)
        try:
            result = await check.check()
        finally:
            await engine.dispose()

        assert result.name == "db"
        assert result.status is CheckStatus.OK

    async def test_renvoie_down_quand_postgres_est_down(self) -> None:
        engine = create_async_engine(_UNREACHABLE_URL)
        factory = async_sessionmaker(bind=engine, expire_on_commit=False)
        check = DatabaseHealthCheck(session_factory=factory)
        try:
            result = await check.check()
        finally:
            await engine.dispose()

        assert result.status is CheckStatus.DOWN
        assert "error" in result.details
