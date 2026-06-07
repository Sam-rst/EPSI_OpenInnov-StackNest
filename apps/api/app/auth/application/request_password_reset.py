"""Use case RequestPasswordReset : envoie un lien de reset (anti-enumeration)."""

import structlog

from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email
from app.auth.infrastructure.email.reset_email import ResetEmail
from app.email.domain.interfaces.email_sender import EmailSender

_logger = structlog.get_logger(__name__)


class RequestPasswordReset:
    """Declenche l'envoi d'un email de reinitialisation de mot de passe.

    Anti-enumeration : la reponse HTTP est toujours generique (202). Si l'email
    est inconnu ou mal forme, le use case s'arrete en silence (aucun token,
    aucun email) — l'appelant ne peut pas deduire l'existence du compte.
    """

    def __init__(
        self,
        *,
        repository: UserRepository,
        token_service: TokenService,
        email_sender: EmailSender,
        reset_token_ttl_seconds: int,
        reset_url_base: str,
    ) -> None:
        self._repository = repository
        self._token_service = token_service
        self._email_sender = email_sender
        self._reset_token_ttl_seconds = reset_token_ttl_seconds
        self._reset_url_base = reset_url_base

    async def execute(self, *, email: str) -> None:
        try:
            normalized = Email(email)
        except ValueError:
            _logger.info("auth.reset.request_invalid_email")
            return

        user = await self._repository.get_by_email(normalized)
        if user is None:
            _logger.info("auth.reset.request_unknown_account")
            return

        token = self._token_service.issue(
            subject=user.id,
            purpose=TokenPurpose.RESET,
            role=user.role,
            token_version=user.token_version,
            ttl_seconds=self._reset_token_ttl_seconds,
        )
        message = ResetEmail.build(
            recipient=user.email,
            token=token,
            reset_url_base=self._reset_url_base,
        )
        await self._email_sender.send(message)
        _logger.info("auth.reset.request_sent", user_id=str(user.id))
