"""Modele ORM SQLAlchemy de la table `stacks`."""

from uuid import UUID

from sqlalchemy import ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base
from app.core.database.pg_enum import pg_enum
from app.core.database.timestamp_mixin import TimestampMixin
from app.stack.domain.enums.stack_status import StackStatus


class StackModel(TimestampMixin, Base):
    """Table `stacks` : projet multi-services compose par un utilisateur.

    - `id`       : UUID genere cote base (`gen_random_uuid()`).
    - `owner_id` : FK vers `users.id` (proprietaire, isolation des acces),
      indexee pour `list_by_owner`.
    - `name`     : libelle saisi par l'utilisateur.
    - `status`   : enum Postgres `stack_status` (machine a etats globale).

    La FK `owner_id` n'utilise pas de cascade : la suppression d'un utilisateur
    est bloquee tant qu'une stack le reference (preservation de l'historique).
    """

    __tablename__ = "stacks"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    owner_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[StackStatus] = mapped_column(
        pg_enum(StackStatus, name="stack_status"),
        nullable=False,
    )
