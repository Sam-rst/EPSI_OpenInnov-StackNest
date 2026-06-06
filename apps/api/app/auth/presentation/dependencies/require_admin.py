"""Dependance FastAPI de controle d'acces : exige le role administrateur."""

from typing import Annotated

from fastapi import Depends

from app.auth.domain.entities.user import User
from app.auth.domain.exceptions.forbidden import ForbiddenException
from app.auth.presentation.dependencies.current_user import get_current_user


async def require_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Autorise la requete seulement si l'utilisateur courant est administrateur.

    Compose `get_current_user` (authentification) puis verifie le role (RBAC).
    Leve une 403 (ForbiddenException) si le role n'est pas admin.
    """
    if not current_user.is_admin():
        raise ForbiddenException()
    return current_user
