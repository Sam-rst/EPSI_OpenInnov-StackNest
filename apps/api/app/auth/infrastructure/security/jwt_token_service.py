"""Adaptateur d'emission/verification de jetons JWT (PyJWT, HS256)."""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import jwt

from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.exceptions.invalid_token import InvalidTokenException
from app.auth.domain.exceptions.token_expired import TokenExpiredException
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.value_objects.token_claims import TokenClaims

_ALGORITHM = "HS256"


class JwtTokenService(TokenService):
    """Implementation de TokenService via JWT signe en HS256.

    Les claims metier (`sub`, `purpose`, `role`, `token_version`) sont portes
    en clair dans le payload ; la signature HMAC garantit l'integrite. La
    finalite (`purpose`) est verifiee a la lecture pour cloisonner les usages.
    Les erreurs PyJWT (infra) sont traduites en exceptions de domaine.
    """

    def __init__(self, secret: str) -> None:
        self._secret = secret

    def issue(
        self,
        *,
        subject: UUID,
        purpose: TokenPurpose,
        role: UserRole,
        token_version: int,
        ttl_seconds: int,
    ) -> str:
        now = datetime.now(UTC)
        payload: dict[str, Any] = {
            "sub": str(subject),
            "purpose": purpose.value,
            "role": role.value,
            "token_version": token_version,
            "iat": now,
            "exp": now + timedelta(seconds=ttl_seconds),
        }
        return jwt.encode(payload, self._secret, algorithm=_ALGORITHM)

    def decode(self, token: str, *, expected_purpose: TokenPurpose) -> TokenClaims:
        payload = self._decode_signed(token)
        return self._to_claims(payload, expected_purpose=expected_purpose)

    def _decode_signed(self, token: str) -> dict[str, Any]:
        try:
            return jwt.decode(token, self._secret, algorithms=[_ALGORITHM])
        except jwt.ExpiredSignatureError as error:
            raise TokenExpiredException() from error
        except jwt.InvalidTokenError as error:
            raise InvalidTokenException() from error

    @staticmethod
    def _to_claims(payload: dict[str, Any], *, expected_purpose: TokenPurpose) -> TokenClaims:
        if payload.get("purpose") != expected_purpose.value:
            raise InvalidTokenException("Finalite du jeton inattendue.")
        try:
            return TokenClaims(
                subject=UUID(payload["sub"]),
                purpose=TokenPurpose(payload["purpose"]),
                role=UserRole(payload["role"]),
                token_version=int(payload["token_version"]),
            )
        except (KeyError, ValueError) as error:
            raise InvalidTokenException("Payload du jeton invalide.") from error
