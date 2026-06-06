"""Use case GetCurrentUser : recupere le profil de l'utilisateur authentifie."""

from uuid import UUID

from app.auth.domain.entities.user import User
from app.auth.domain.exceptions.invalid_credentials import InvalidCredentialsException
from app.auth.domain.interfaces.user_repository import UserRepository


class GetCurrentUser:
    """Charge le profil a jour d'un utilisateur a partir de son identifiant.

    Utilise par `GET /auth/me`. Recharge depuis le depot (et non depuis les
    claims du jeton) pour renvoyer un etat frais (role, `is_verified`). Leve une
    InvalidCredentialsException (401) si le compte a disparu entre temps.
    """

    def __init__(self, *, repository: UserRepository) -> None:
        self._repository = repository

    async def execute(self, *, user_id: UUID) -> User:
        user = await self._repository.get_by_id(user_id)
        if user is None:
            raise InvalidCredentialsException("Utilisateur introuvable.")
        return user
