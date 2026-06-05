"""Tests unitaires du ping bas niveau check_database (SELECT 1).

check_database execute `SELECT 1` sur une session et :
- ne leve rien si la base repond,
- convertit toute erreur driver/infra en DatabaseUnavailableException typee
  (politique try/except sur infra uniquement, cause preservee via `from`).
"""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.database.exceptions.database_unavailable_exception import (
    DatabaseUnavailableException,
)
from app.core.database.healthcheck import check_database


class TestCheckDatabase:
    async def test_ne_leve_pas_quand_la_base_repond(self) -> None:
        session = AsyncMock()
        session.execute = AsyncMock(return_value=MagicMock())

        await check_database(session)

        session.execute.assert_awaited_once()

    async def test_convertit_erreur_driver_en_exception_typee(self) -> None:
        session = AsyncMock()
        session.execute = AsyncMock(side_effect=OSError("connection refused"))

        with pytest.raises(DatabaseUnavailableException) as exc_info:
            await check_database(session)

        assert exc_info.value.code == "DATABASE_UNAVAILABLE"
        assert isinstance(exc_info.value.__cause__, OSError)
