"""Tests unitaires de la fabrique du moteur/sessionmaker (memoisation)."""

from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker

from app.core.database.engine import get_engine, get_sessionmaker


class TestEngineFactory:
    def test_get_engine_renvoie_un_async_engine_unique(self) -> None:
        get_engine.cache_clear()

        first = get_engine()
        second = get_engine()

        assert isinstance(first, AsyncEngine)
        assert first is second  # memoize -> meme instance (pool partage)

    def test_get_sessionmaker_renvoie_une_fabrique_unique(self) -> None:
        get_sessionmaker.cache_clear()

        first = get_sessionmaker()
        second = get_sessionmaker()

        assert isinstance(first, async_sessionmaker)
        assert first is second
