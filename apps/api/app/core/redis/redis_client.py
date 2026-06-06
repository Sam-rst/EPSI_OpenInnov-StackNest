"""Fabrique du client Redis asynchrone partage.

Un seul client (pool de connexions) par URL et par process, memoize via
`@lru_cache`. Le client est cree paresseusement a la premiere demande pour ne
pas ouvrir de connexion a l'import (les tests unit n'ont pas de Redis). L'URL
provient de `Settings.redis_url` (env var `REDIS_URL`).
"""

from functools import lru_cache

from redis.asyncio import Redis

from app.core.config import get_settings


@lru_cache
def get_redis_client(url: str | None = None) -> Redis:
    """Renvoie le client Redis asynchrone partage (memoize par URL)."""
    effective_url = url or get_settings().redis_url
    return Redis.from_url(effective_url, decode_responses=True)
