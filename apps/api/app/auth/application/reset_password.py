"""Use case ResetPassword : change le mot de passe via un token de reset."""

import structlog

from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.exceptions.invalid_token import InvalidTokenException
from app.auth.domain.interfaces.password_hasher import PasswordHasher
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.password import Password

_logger = structlog.get_logger(__name__)


class ResetPassword:
    """Reinitialise le mot de passe d'un utilisateur via un token `reset`.

    Single-use : le token porte la `token_version` du compte au moment de la
    demande ; le reset bump cette version, donc rejouer le meme token echoue
    (version perimee). Le bump invalide aussi les refresh tokens en cours
    (deconnexion globale apres reset, mesure de securite).
    """

    def __init__(
        self,
        *,
        repository: UserRepository,
        hasher: PasswordHasher,
        token_service: TokenService,
    ) -> None:
        self._repository = repository
        self._hasher = hasher
        self._token_service = token_service

    async def execute(self, *, token: str, new_password: str) -> None:
        claims = self._token_service.decode(token, expected_purpose=TokenPurpose.RESET)
        user = await self._repository.get_by_id(claims.subject)
        if user is None or user.token_version != claims.token_version:
            raise InvalidTokenException("Jeton revoque ou utilisateur introuvable.")

        password = Password(new_password)
        user.password_hash = self._hasher.hash(password)
        user.token_version += 1
        await self._repository.update(user)
        _logger.info("auth.reset.completed", user_id=str(user.id))
