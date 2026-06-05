"""Tests unitaires du cycle de vie de la session SQLAlchemy (get_session).

On mocke l'`async_sessionmaker` pour verifier la politique transactionnelle
sans toucher a une vraie base : commit sur succes, rollback sur exception,
close systematique (finally).
"""

from collections.abc import AsyncIterator
from contextlib import AbstractAsyncContextManager, suppress
from typing import Any
from unittest.mock import AsyncMock, MagicMock

from app.core.database.session import get_session


class _FakeSessionContext(AbstractAsyncContextManager[Any]):
    """Reproduit `async with sessionmaker() as session` autour d'un mock."""

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


async def _drain(iterator: AsyncIterator[Any]) -> AsyncMock:
    return await anext(iterator)


class TestGetSessionLifecycle:
    async def test_commit_et_close_quand_aucune_erreur(self) -> None:
        session = AsyncMock()
        maker = _sessionmaker_yielding(session)

        generator = get_session(session_factory=maker)
        yielded = await _drain(generator)
        assert yielded is session
        # Fin normale du `async with` cote consommateur -> reprend le generateur.
        with suppress(StopAsyncIteration):
            await anext(generator)

        session.commit.assert_awaited_once()
        session.rollback.assert_not_awaited()
        session.close.assert_awaited_once()

    async def test_rollback_et_close_quand_le_consommateur_leve(self) -> None:
        session = AsyncMock()
        maker = _sessionmaker_yielding(session)

        generator = get_session(session_factory=maker)
        await _drain(generator)
        boom = RuntimeError("handler a echoue")
        with suppress(RuntimeError):
            await generator.athrow(boom)

        session.rollback.assert_awaited_once()
        session.commit.assert_not_awaited()
        session.close.assert_awaited_once()
