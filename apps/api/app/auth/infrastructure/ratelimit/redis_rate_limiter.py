"""Limiteur de debit base sur Redis (compteur a fenetre fixe)."""

from redis.asyncio import Redis

from app.auth.domain.interfaces.rate_limiter import RateLimiter

_KEY_PREFIX = "ratelimit:"


class RedisRateLimiter(RateLimiter):
    """Implementation de RateLimiter par compteur a fenetre fixe dans Redis.

    A chaque tentative, on incremente un compteur dont la cle integre la
    fenetre courante ; la cle expire automatiquement (`EXPIRE`) a la fin de la
    fenetre. Le compteur etant dans Redis, la limite est partagee entre toutes
    les instances de l'API. La fenetre fixe est volontairement simple (MVP) ;
    une fenetre glissante plus precise pourra suivre si besoin.
    """

    def __init__(self, client: Redis, *, max_attempts: int, window_seconds: int) -> None:
        self._client = client
        self._max_attempts = max_attempts
        self._window_seconds = window_seconds

    async def is_allowed(self, key: str) -> bool:
        redis_key = f"{_KEY_PREFIX}{key}"
        attempts = int(await self._client.incr(redis_key))
        if attempts == 1:
            await self._client.expire(redis_key, self._window_seconds)
        return attempts <= self._max_attempts
