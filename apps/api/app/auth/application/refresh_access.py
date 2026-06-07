"""Use case RefreshAccess : re-emet une paire access/refresh depuis un refresh."""

import structlog

from app.auth.application.refresh_result import RefreshResult
from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.exceptions.invalid_token import InvalidTokenException
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository

_logger = structlog.get_logger(__name__)


class RefreshAccess:
    """Echange un refresh token valide contre une nouvelle paire de jetons.

    Verifie la finalite (`refresh`), charge l'utilisateur et controle que le
    claim `token_version` correspond a celui du compte. Un compte ayant bump sa
    version (logout, reset) invalide ainsi tous les refresh emis avant. La
    rotation (nouveau refresh a chaque appel) garde le cookie a jour sans
    persister d'etat serveur (stateless MVP).
    """

    def __init__(
        self,
        *,
        repository: UserRepository,
        token_service: TokenService,
        access_token_ttl_seconds: int,
        refresh_token_ttl_seconds: int,
    ) -> None:
        self._repository = repository
        self._token_service = token_service
        self._access_token_ttl_seconds = access_token_ttl_seconds
        self._refresh_token_ttl_seconds = refresh_token_ttl_seconds

    async def execute(self, *, refresh_token: str) -> RefreshResult:
        claims = self._token_service.decode(refresh_token, expected_purpose=TokenPurpose.REFRESH)
        user = await self._repository.get_by_id(claims.subject)
        if user is None or user.token_version != claims.token_version:
            raise InvalidTokenException("Jeton revoque ou utilisateur introuvable.")

        _logger.info("auth.refresh.rotated", user_id=str(user.id))
        return RefreshResult(
            access_token=self._issue(user, TokenPurpose.ACCESS, self._access_token_ttl_seconds),
            refresh_token=self._issue(user, TokenPurpose.REFRESH, self._refresh_token_ttl_seconds),
        )

    def _issue(self, user: User, purpose: TokenPurpose, ttl_seconds: int) -> str:
        return self._token_service.issue(
            subject=user.id,
            purpose=purpose,
            role=user.role,
            token_version=user.token_version,
            ttl_seconds=ttl_seconds,
        )
