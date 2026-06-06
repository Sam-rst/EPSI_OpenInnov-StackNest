"""Use case LoginUser : authentifie un utilisateur et emet access + refresh."""

import structlog

from app.auth.application.login_result import LoginResult
from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.exceptions.email_not_verified import EmailNotVerifiedException
from app.auth.domain.exceptions.invalid_credentials import InvalidCredentialsException
from app.auth.domain.interfaces.password_hasher import PasswordHasher
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email
from app.auth.domain.value_objects.password import Password

_logger = structlog.get_logger(__name__)

# Empreinte bcrypt factice (mot de passe "anti-timing-dummy-password-0").
# Utilisee pour verifier un hash meme quand le compte n'existe pas, afin que le
# temps de reponse ne revele pas l'absence d'un email (anti-enumeration). Ce
# n'est le hash d'aucun compte reel.
_DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO/8Vr0xkE8q8cQ7uVbY2zJ1QwU7m7lqK"


class LoginUser:
    """Verifie les identifiants et delivre une paire access/refresh.

    Securite :
    - anti-timing : on execute toujours une verification de hash, meme si l'email
      est inconnu ou mal forme (hash factice), pour ne pas reveler l'existence
      du compte par un ecart de temps de reponse ;
    - message generique (`InvalidCredentialsException`) qui ne distingue pas
      email inconnu et mot de passe errone ;
    - refus si l'email n'est pas verifie quand la politique l'exige.
    """

    def __init__(
        self,
        *,
        repository: UserRepository,
        hasher: PasswordHasher,
        token_service: TokenService,
        require_email_verification: bool,
        access_token_ttl_seconds: int,
        refresh_token_ttl_seconds: int,
    ) -> None:
        self._repository = repository
        self._hasher = hasher
        self._token_service = token_service
        self._require_email_verification = require_email_verification
        self._access_token_ttl_seconds = access_token_ttl_seconds
        self._refresh_token_ttl_seconds = refresh_token_ttl_seconds

    async def execute(self, *, email: str, password: str) -> LoginResult:
        user = await self._find_user(email)
        candidate = self._safe_password(password)

        if not self._password_matches(user, candidate):
            raise InvalidCredentialsException()

        # `user` est forcement non None ici : _password_matches renvoie False
        # quand user est None (apres le hash factice anti-timing).
        assert user is not None
        if self._require_email_verification and not user.is_verified:
            raise EmailNotVerifiedException()

        _logger.info("auth.login.success", user_id=str(user.id))
        return LoginResult(
            access_token=self._issue(user, TokenPurpose.ACCESS, self._access_token_ttl_seconds),
            refresh_token=self._issue(user, TokenPurpose.REFRESH, self._refresh_token_ttl_seconds),
            user=user,
        )

    async def _find_user(self, email: str) -> User | None:
        try:
            normalized = Email(email)
        except ValueError:
            return None
        return await self._repository.get_by_email(normalized)

    @staticmethod
    def _safe_password(password: str) -> Password | None:
        try:
            return Password(password)
        except ValueError:
            return None

    def _password_matches(self, user: User | None, candidate: Password | None) -> bool:
        # Toujours executer une verification bcrypt (cout constant) pour
        # l'anti-timing : si pas de compte ou mot de passe mal forme, on verifie
        # contre une empreinte factice et on renvoie False.
        if candidate is None:
            self._hasher.verify(Password("anti-timing-dummy-password-0"), _DUMMY_HASH)
            return False
        target_hash = user.password_hash if user is not None else _DUMMY_HASH
        matches = self._hasher.verify(candidate, target_hash)
        return matches and user is not None

    def _issue(self, user: User, purpose: TokenPurpose, ttl_seconds: int) -> str:
        return self._token_service.issue(
            subject=user.id,
            purpose=purpose,
            role=user.role,
            token_version=user.token_version,
            ttl_seconds=ttl_seconds,
        )
