"""Dependance FastAPI de rate-limiting par IP et par endpoint.

`rate_limit("login")` renvoie une dependance qui, a chaque requete, incremente
un compteur Redis dont la cle combine l'endpoint et l'IP cliente. Au-dela de la
limite configuree, elle leve une 429. Cible : `/login`, `/register`, `/forgot`.
"""

from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, Request

from app.auth.domain.interfaces.rate_limiter import RateLimiter
from app.auth.presentation.dependencies.auth_providers import get_rate_limiter
from app.auth.presentation.exceptions.rate_limited import RateLimitedException


def _client_ip(request: Request) -> str:
    """Renvoie l'IP cliente (ou 'unknown' si la connexion ne l'expose pas)."""
    if request.client is None:
        return "unknown"
    return request.client.host


def rate_limit(endpoint: str) -> Callable[..., Awaitable[None]]:
    """Fabrique une dependance de rate-limit pour un endpoint donne."""

    async def _enforce(
        request: Request,
        limiter: Annotated[RateLimiter, Depends(get_rate_limiter)],
    ) -> None:
        key = f"{endpoint}:{_client_ip(request)}"
        if not await limiter.is_allowed(key):
            raise RateLimitedException()

    return _enforce
