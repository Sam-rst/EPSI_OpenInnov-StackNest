"""Tests unitaires de la fabrique du client Redis."""

from redis.asyncio import Redis

from app.core.redis.redis_client import get_redis_client


class TestGetRedisClient:
    def test_renvoie_un_client_redis_asyncio(self) -> None:
        client = get_redis_client(url="redis://localhost:6379/0")

        assert isinstance(client, Redis)

    def test_memoize_le_client_par_url(self) -> None:
        first = get_redis_client(url="redis://localhost:6379/0")
        second = get_redis_client(url="redis://localhost:6379/0")

        assert first is second
