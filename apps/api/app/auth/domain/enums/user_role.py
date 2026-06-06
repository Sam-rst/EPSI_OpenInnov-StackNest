"""Roles applicatifs d'un utilisateur (RBAC)."""

from enum import StrEnum


class UserRole(StrEnum):
    """Role d'un utilisateur dans StackNest.

    - `USER`  : utilisateur standard (provisionne ses propres ressources)
    - `ADMIN` : administrateur (gestion du catalogue, des utilisateurs, etc.)

    StrEnum : la valeur se serialise directement en chaine pour le stockage
    (colonne enum Postgres `user_role`) et l'API.
    """

    USER = "user"
    ADMIN = "admin"
