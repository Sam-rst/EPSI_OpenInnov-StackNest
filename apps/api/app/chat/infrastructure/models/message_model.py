"""Modele ORM SQLAlchemy de la table `messages`."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Text, func, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.chat.domain.enums.message_role import MessageRole
from app.core.database.base import Base
from app.core.database.pg_enum import pg_enum


class MessageModel(Base):
    """Table `messages` : message persiste d'une conversation.

    - `id`              : UUID genere cote base (`gen_random_uuid()`).
    - `conversation_id` : FK vers `conversations.id` (cascade ON DELETE : la
      suppression d'un fil emporte ses messages), indexee pour `list_messages`.
    - `role`            : enum Postgres `message_role` (user / assistant / tool).
    - `content`         : texte du message (TEXT, eventuellement vide).
    - `created_at`      : horodatage de creation (gere cote base), sert d'ordre
      chronologique de relecture.

    Pas de `TimestampMixin` : un message est immuable une fois ecrit, seul
    `created_at` est pertinent (pas d'`updated_at`).
    """

    __tablename__ = "messages"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    conversation_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[MessageRole] = mapped_column(
        pg_enum(MessageRole, name="message_role"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
