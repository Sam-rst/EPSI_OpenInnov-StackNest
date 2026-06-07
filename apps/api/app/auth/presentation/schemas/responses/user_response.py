"""Schema de representation publique d'un utilisateur."""

from uuid import UUID

from pydantic import BaseModel

from app.auth.domain.entities.user import User
from app.auth.domain.enums.user_role import UserRole


class UserResponse(BaseModel):
    """Vue publique d'un utilisateur (jamais le hash de mot de passe)."""

    id: UUID
    email: str
    role: UserRole
    is_verified: bool

    @classmethod
    def from_entity(cls, user: User) -> "UserResponse":
        """Construit la reponse a partir de l'entite de domaine."""
        return cls(
            id=user.id,
            email=user.email.value,
            role=user.role,
            is_verified=user.is_verified,
        )
