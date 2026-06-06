"""Use case VerifyEmail : active un compte a partir d'un token de verification."""

import structlog

from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.exceptions.invalid_token import InvalidTokenException
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository

_logger = structlog.get_logger(__name__)


class VerifyEmail:
    """Verifie l'adresse email d'un utilisateur via un token de finalite `verify`.

    Idempotent : verifier un compte deja verifie ne fait rien d'autre que
    confirmer l'etat (pas d'erreur). Le token n'est pas single-use cote stockage
    (stateless) ; sa courte duree de vie et son cloisonnement par `purpose`
    suffisent pour le MVP.
    """

    def __init__(self, *, repository: UserRepository, token_service: TokenService) -> None:
        self._repository = repository
        self._token_service = token_service

    async def execute(self, *, token: str) -> None:
        claims = self._token_service.decode(token, expected_purpose=TokenPurpose.VERIFY)
        user = await self._repository.get_by_id(claims.subject)
        if user is None:
            raise InvalidTokenException("Jeton revoque ou utilisateur introuvable.")

        if user.is_verified:
            return

        user.is_verified = True
        await self._repository.update(user)
        _logger.info("auth.verify.verified", user_id=str(user.id))
