"""Value object TokenClaims : claims metier portes par un JWT verifie."""

from dataclasses import dataclass
from uuid import UUID

from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole


@dataclass(frozen=True)
class TokenClaims:
    """Claims metier d'un JWT, decodes et valides par le `TokenService`.

    Immutable : represente le contenu d'un jeton a un instant donne. Les claims
    techniques JWT (`exp`, `iat`) sont geres par l'implementation et ne sont pas
    exposes ici — le domaine ne raisonne que sur les claims metier.

    - `subject`       : identifiant de l'utilisateur (claim JWT `sub`)
    - `purpose`       : finalite du jeton (claim `purpose`)
    - `role`          : role RBAC au moment de l'emission (claim `role`)
    - `token_version` : version de revocation (claim `token_version`)
    """

    subject: UUID
    purpose: TokenPurpose
    role: UserRole
    token_version: int
