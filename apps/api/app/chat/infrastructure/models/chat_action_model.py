"""Modele ORM SQLAlchemy de la table `chat_actions`."""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.action_status import ActionStatus
from app.core.database.base import Base
from app.core.database.pg_enum import pg_enum


class ChatActionModel(Base):
    """Table `chat_actions` : trace auditable d'une action proposee par le chat.

    - `id`              : UUID genere cote base (`gen_random_uuid()`).
    - `conversation_id` : FK vers `conversations.id` (cascade ON DELETE).
    - `message_id`      : FK vers `messages.id` (cascade ON DELETE) — message
      assistant ayant emis la proposition.
    - `kind`            : enum Postgres `chat_action_kind`.
    - `args`            : arguments valides de l'action serialises en JSONB.
    - `status`          : enum Postgres `chat_action_status` (cycle de vie).
    - `deployment_id`   : FK NULLABLE vers `deployments.id` (ON DELETE SET NULL :
      la trace de l'action survit a la suppression du deploiement).
    - `created_at`      : horodatage de creation (gere cote base).

    Pas de `TimestampMixin` : une action evolue via `status` mais on ne suit pas
    d'`updated_at` au MVP (l'historique se lit via le `status`).
    """

    __tablename__ = "chat_actions"

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
    message_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
    )
    kind: Mapped[ActionKind] = mapped_column(
        pg_enum(ActionKind, name="chat_action_kind"),
        nullable=False,
    )
    args: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    status: Mapped[ActionStatus] = mapped_column(
        pg_enum(ActionStatus, name="chat_action_status"),
        nullable=False,
    )
    deployment_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("deployments.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
