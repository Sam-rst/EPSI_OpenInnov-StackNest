"""Use case LogoutUser : invalide tous les refresh d'un utilisateur."""

from uuid import UUID

import structlog

from app.auth.domain.exceptions.invalid_token import InvalidTokenException
from app.auth.domain.interfaces.user_repository import UserRepository

_logger = structlog.get_logger(__name__)


class LogoutUser:
    """Deconnecte un utilisateur en incrementant sa `token_version`.

    Le bump invalide tous les refresh tokens emis avant (ils portent l'ancienne
    version) : c'est une deconnexion globale (tous les appareils). Le router se
    charge en complement d'effacer le cookie refresh cote client.
    """

    def __init__(self, *, repository: UserRepository) -> None:
        self._repository = repository

    async def execute(self, *, user_id: UUID) -> None:
        user = await self._repository.get_by_id(user_id)
        if user is None:
            raise InvalidTokenException("Utilisateur introuvable.")

        user.token_version += 1
        await self._repository.update(user)
        _logger.info("auth.logout.token_version_bumped", user_id=str(user.id))
