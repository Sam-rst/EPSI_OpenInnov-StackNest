"""Tests d'integration du RedisRateLimiter contre un Redis reel (testcontainers)."""

import time
from collections.abc import Iterator

import pytest
from redis.asyncio import Redis
from testcontainers.redis import RedisContainer

from app.auth.infrastructure.ratelimit.redis_rate_limiter import RedisRateLimiter


@pytest.fixture(scope="module")
def redis_url() -> Iterator[str]:
    container = RedisContainer("redis:7-alpine")
    container.start()
    try:
        host = container.get_container_host_ip()
        port = container.get_exposed_port(6379)
        time.sleep(0.5)
        yield f"redis://{host}:{port}/0"
    finally:
        container.stop()


@pytest.fixture
async def client(redis_url: str) -> Redis:
    return Redis.from_url(redis_url, decode_responses=True)


class TestRedisRateLimiter:
    async def test_autorise_jusqu_a_la_limite(self, client: Redis) -> None:
        limiter = RedisRateLimiter(client, max_attempts=3, window_seconds=60)

        results = [await limiter.is_allowed("login:ip-a") for _ in range(3)]

        assert all(results)

    async def test_bloque_au_dela_de_la_limite(self, client: Redis) -> None:
        limiter = RedisRateLimiter(client, max_attempts=2, window_seconds=60)

        await limiter.is_allowed("login:ip-b")
        await limiter.is_allowed("login:ip-b")
        depasse = await limiter.is_allowed("login:ip-b")

        assert depasse is False

    async def test_cles_distinctes_comptent_separement(self, client: Redis) -> None:
        limiter = RedisRateLimiter(client, max_attempts=1, window_seconds=60)

        premier = await limiter.is_allowed("login:ip-c")
        autre_cle = await limiter.is_allowed("login:ip-d")

        assert premier is True
        assert autre_cle is True

    async def test_expire_la_fenetre(self, client: Redis) -> None:
        limiter = RedisRateLimiter(client, max_attempts=1, window_seconds=1)

        assert await limiter.is_allowed("login:ip-e") is True
        assert await limiter.is_allowed("login:ip-e") is False
        time.sleep(1.2)
        assert await limiter.is_allowed("login:ip-e") is True
