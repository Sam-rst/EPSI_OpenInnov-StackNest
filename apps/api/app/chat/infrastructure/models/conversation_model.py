"""Modele ORM SQLAlchemy de la table `conversations`."""

from uuid import UUID

from sqlalchemy import ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base
from app.core.database.timestamp_mixin import TimestampMixin


class ConversationModel(TimestampMixin, Base):
    """Table `conversations` : fil de discussion du chat IA d'un utilisateur.

    - `id`       : UUID genere cote base (`gen_random_uuid()`).
    - `owner_id` : FK vers `users.id` (proprietaire, isolation des acces),
      indexee pour `list_by_owner`.
    - `title`    : libelle du fil affiche dans la sidebar.

    La FK n'utilise pas de cascade : la suppression d'un utilisateur est bloquee
    tant qu'un fil le reference (coherent avec le socle).
    """

    __tablename__ = "conversations"

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
    title: Mapped[str] = mapped_column(String(200), nullable=False)
