"""Use case RegisterUser : inscription ouverte avec verification d'email."""

from uuid import uuid4

import structlog

from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.interfaces.password_hasher import PasswordHasher
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email
from app.auth.domain.value_objects.password import Password
from app.auth.infrastructure.email.verification_email import VerificationEmail
from app.email.domain.interfaces.email_sender import EmailSender

_logger = structlog.get_logger(__name__)


class RegisterUser:
    """Inscrit un nouvel utilisateur (role `user`) non verifie et lui envoie un
    email de verification.

    Anti-enumeration : si l'email est deja pris, le use case s'arrete en silence
    (aucun nouvel utilisateur, aucun token, aucun email) afin que la reponse HTTP
    reste identique (202) quel que soit l'etat du compte — l'appelant ne peut
    pas deduire si l'adresse existe deja.
    """

    def __init__(
        self,
        *,
        repository: UserRepository,
        hasher: PasswordHasher,
        token_service: TokenService,
        email_sender: EmailSender,
        verify_token_ttl_seconds: int,
        verify_url_base: str,
    ) -> None:
        self._repository = repository
        self._hasher = hasher
        self._token_service = token_service
        self._email_sender = email_sender
        self._verify_token_ttl_seconds = verify_token_ttl_seconds
        self._verify_url_base = verify_url_base

    async def execute(self, *, email: str, password: str) -> None:
        normalized_email = Email(email)
        plain_password = Password(password)

        if await self._repository.get_by_email(normalized_email) is not None:
            _logger.info("auth.register.email_already_used")
            return

        user = User(
            id=uuid4(),
            email=normalized_email,
            password_hash=self._hasher.hash(plain_password),
            role=UserRole.USER,
            is_verified=False,
            token_version=0,
        )
        created = await self._repository.add(user)

        token = self._token_service.issue(
            subject=created.id,
            purpose=TokenPurpose.VERIFY,
            role=created.role,
            token_version=created.token_version,
            ttl_seconds=self._verify_token_ttl_seconds,
        )
        message = VerificationEmail.build(
            recipient=created.email,
            token=token,
            verify_url_base=self._verify_url_base,
        )
        await self._email_sender.send(message)
        _logger.info("auth.register.created", user_id=str(created.id))
