"""Resultat applicatif d'une connexion reussie (access + refresh + utilisateur)."""

from dataclasses import dataclass

from app.auth.domain.entities.user import User


@dataclass(frozen=True)
class LoginResult:
    """Jetons emis a la connexion et utilisateur authentifie.

    DTO de la couche application : le router presentation le traduit en reponse
    HTTP (access dans le body, refresh dans un cookie httpOnly).
    """

    access_token: str
    refresh_token: str
    user: User
