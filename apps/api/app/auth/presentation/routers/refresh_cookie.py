"""Helper de gestion du cookie de refresh token (httpOnly/Secure/SameSite).

Centralise les attributs de securite du cookie pour eviter toute divergence
entre la pose (login/refresh) et l'effacement (logout). Le cookie est restreint
au chemin `/auth/refresh` : il n'est envoye que sur cet endpoint, reduisant la
surface CSRF et la fuite dans les logs d'acces des autres routes.
"""

from fastapi import Response

from app.core.config import Settings

_COOKIE_PATH = "/auth/refresh"


def set_refresh_cookie(response: Response, *, token: str, settings: Settings) -> None:
    """Pose le cookie refresh avec les attributs de securite des settings."""
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=token,
        max_age=settings.jwt_refresh_ttl_seconds,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        path=_COOKIE_PATH,
    )


def clear_refresh_cookie(response: Response, *, settings: Settings) -> None:
    """Efface le cookie refresh (logout) en ciblant le meme chemin/attributs."""
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=_COOKIE_PATH,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
    )
