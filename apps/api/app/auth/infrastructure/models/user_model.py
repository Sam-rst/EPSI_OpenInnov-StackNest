"""Modele ORM SQLAlchemy de la table `users`."""

from uuid import UUID

from sqlalchemy import Boolean, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.auth.domain.enums.user_role import UserRole
from app.core.database.base import Base
from app.core.database.pg_enum import pg_enum
from app.core.database.timestamp_mixin import TimestampMixin


class UserModel(TimestampMixin, Base):
    """Table `users` : identite + RBAC des utilisateurs de la plateforme.

    - `id`            : UUID genere cote base (`gen_random_uuid()`).
    - `email`         : unique, stocke normalise (minuscules) par le VO Email.
    - `role`          : enum Postgres `user_role` (defaut `user`).
    - `token_version` : compteur de revocation des jetons (defaut 0).
    """

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        pg_enum(UserRole, name="user_role"),
        nullable=False,
        server_default=UserRole.USER.value,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    token_version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
