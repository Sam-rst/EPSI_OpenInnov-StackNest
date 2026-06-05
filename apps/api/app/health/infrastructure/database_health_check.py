"""Adapter HealthCheck pour la base de donnees (SELECT 1).

Branche le ping `check_database` (core/database) sur le port HealthCheck du
slice health. Conforme au contrat du port : **tolerant aux erreurs**, il
retourne `CheckResult(status=DOWN, ...)` au lieu de propager
`DatabaseUnavailableException` — c'est le use case qui decide du global
OK/DOWN.
"""

from time import perf_counter

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.database.exceptions.database_unavailable_exception import (
    DatabaseUnavailableException,
)
from app.core.database.healthcheck import check_database
from app.health.application.ports.health_check import HealthCheck
from app.health.domain.enums.check_status import CheckStatus
from app.health.domain.value_objects.check_result import CheckResult

_CHECK_NAME = "db"


class DatabaseHealthCheck(HealthCheck):
    """Verifie la disponibilite de Postgres via un `SELECT 1`."""

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory

    @property
    def name(self) -> str:
        return _CHECK_NAME

    async def check(self) -> CheckResult:
        started_at = perf_counter()
        try:
            async with self._session_factory() as session:
                await check_database(session)
        except DatabaseUnavailableException as err:
            return self._down_result(started_at, err.message)
        return self._ok_result(started_at)

    def _ok_result(self, started_at: float) -> CheckResult:
        return CheckResult(
            name=_CHECK_NAME,
            status=CheckStatus.OK,
            duration_ms=self._elapsed_ms(started_at),
        )

    def _down_result(self, started_at: float, error: str) -> CheckResult:
        return CheckResult(
            name=_CHECK_NAME,
            status=CheckStatus.DOWN,
            duration_ms=self._elapsed_ms(started_at),
            details={"error": error},
        )

    @staticmethod
    def _elapsed_ms(started_at: float) -> float:
        return (perf_counter() - started_at) * 1000
