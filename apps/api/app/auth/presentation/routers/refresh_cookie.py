"""Helper de gestion du cookie de refresh token (httpOnly/Secure/SameSite).

Centralise les attributs de securite du cookie pour eviter toute divergence
entre la pose (login/refresh) et l'effacement (logout). Le chemin vient des
settings (`refresh_cookie_path`, defaut `/`) : l'API etant servie derriere un
prefixe de passerelle `/api` (Vite en dev, Nginx en prod), un chemin restreint
cote back ne matcherait pas l'URL publique et le cookie ne serait jamais renvoye.
"""

from fastapi import Response

from app.core.config import Settings


def set_refresh_cookie(response: Response, *, token: str, settings: Settings) -> None:
    """Pose le cookie refresh avec les attributs de securite des settings."""
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=token,
        max_age=settings.jwt_refresh_ttl_seconds,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        path=settings.refresh_cookie_path,
    )


def clear_refresh_cookie(response: Response, *, settings: Settings) -> None:
    """Efface le cookie refresh (logout) en ciblant le meme chemin/attributs."""
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
    )
