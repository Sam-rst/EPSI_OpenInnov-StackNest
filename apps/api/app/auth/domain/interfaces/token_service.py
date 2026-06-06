"""Interface (port) du service d'emission/verification de jetons JWT."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.value_objects.token_claims import TokenClaims


class TokenService(ABC):
    """Contrat d'emission et de verification de jetons.

    Implemente en infrastructure par un adaptateur concret (JWT/PyJWT). Emet des
    jetons signes portant les claims metier (`sub`, `purpose`, `role`,
    `token_version`, `exp`) et les verifie (signature, expiration, finalite).
    """

    @abstractmethod
    def issue(
        self,
        *,
        subject: UUID,
        purpose: TokenPurpose,
        role: UserRole,
        token_version: int,
        ttl_seconds: int,
    ) -> str:
        """Emet un jeton signe pour la finalite donnee, valable `ttl_seconds`."""

    @abstractmethod
    def decode(self, token: str, *, expected_purpose: TokenPurpose) -> TokenClaims:
        """Verifie un jeton (signature, expiration, finalite) et renvoie ses claims.

        Leve `TokenExpiredException` si expire, `InvalidTokenException` si la
        signature est invalide, le payload malforme ou la finalite inattendue.
        """
