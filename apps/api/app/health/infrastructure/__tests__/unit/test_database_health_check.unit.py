"""Tests unitaires du DatabaseHealthCheck (session mockee, pas de vraie DB).

On verifie le contrat du port HealthCheck :
- nom stable `db`,
- `SELECT 1` reussi -> CheckResult OK,
- erreur infra (DatabaseUnavailableException) attrapee -> CheckResult DOWN
  (le port impose la tolerance aux erreurs : on ne propage pas l'exception).
"""

from contextlib import AbstractAsyncContextManager
from typing import Any
from unittest.mock import AsyncMock, MagicMock

from app.core.database.exceptions.database_unavailable_exception import (
    DatabaseUnavailableException,
)
from app.health.domain.enums.check_status import CheckStatus
from app.health.infrastructure.database_health_check import DatabaseHealthCheck


class _FakeSessionContext(AbstractAsyncContextManager[Any]):
    def __init__(self, session: AsyncMock) -> None:
        self._session = session

    async def __aenter__(self) -> AsyncMock:
        return self._session

    async def __aexit__(self, *_exc: object) -> None:
        await self._session.close()


def _sessionmaker_yielding(session: AsyncMock) -> MagicMock:
    maker = MagicMock()
    maker.return_value = _FakeSessionContext(session)
    return maker


class TestDatabaseHealthCheck:
    def test_nom_est_db(self) -> None:
        check = DatabaseHealthCheck(session_factory=MagicMock())

        assert check.name == "db"

    async def test_select_1_reussi_renvoie_ok(self) -> None:
        session = AsyncMock()
        session.execute = AsyncMock(return_value=MagicMock())
        check = DatabaseHealthCheck(session_factory=_sessionmaker_yielding(session))

        result = await check.check()

        assert result.name == "db"
        assert result.status is CheckStatus.OK
        assert result.duration_ms >= 0
        session.execute.assert_awaited_once()

    async def test_erreur_infra_renvoie_down_sans_propager(self) -> None:
        session = AsyncMock()
        session.execute = AsyncMock(
            side_effect=DatabaseUnavailableException("connexion refusee")
        )
        check = DatabaseHealthCheck(session_factory=_sessionmaker_yielding(session))

        result = await check.check()

        assert result.status is CheckStatus.DOWN
        assert "error" in result.details
