"""Entite de domaine User : identite d'un utilisateur de la plateforme."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.value_objects.email import Email


@dataclass
class User:
    """Utilisateur de StackNest (identite + RBAC).

    Entite mutable (identifiee par `id`) : `token_version`, `is_verified` et le
    `password_hash` evoluent au cours de la vie du compte. Les guard clauses
    garantissent les invariants metier a la construction.

    - `password_hash` : empreinte bcrypt (jamais le mot de passe en clair).
    - `token_version` : incremente pour invalider tous les jetons emis (logout
      global, reset de mot de passe). Un jeton dont le claim `token_version`
      differe de celui-ci est rejete.
    """

    id: UUID
    email: Email
    password_hash: str
    role: UserRole = UserRole.USER
    is_verified: bool = False
    token_version: int = 0
    created_at: datetime | None = field(default=None)
    updated_at: datetime | None = field(default=None)

    def __post_init__(self) -> None:
        if not self.password_hash:
            raise ValueError("User.password_hash ne doit pas etre vide.")
        if self.token_version < 0:
            raise ValueError("User.token_version doit etre >= 0.")

    def is_admin(self) -> bool:
        """Vrai si l'utilisateur a le role administrateur."""
        return self.role is UserRole.ADMIN
