"""Resultat applicatif d'un rafraichissement (nouvel access + nouveau refresh)."""

from dataclasses import dataclass


@dataclass(frozen=True)
class RefreshResult:
    """Nouvelle paire de jetons emise lors d'un refresh.

    DTO de la couche application : le router renvoie `access_token` dans le body
    et `refresh_token` dans un nouveau cookie httpOnly (rotation a chaque refresh).
    """

    access_token: str
    refresh_token: str
