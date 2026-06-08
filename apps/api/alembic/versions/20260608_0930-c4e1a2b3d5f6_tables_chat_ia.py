"""tables chat ia

Cree les 3 tables de la slice Chat IA :
- `conversations` : fil de discussion d'un utilisateur (FK `owner_id -> users`).
- `messages`      : messages d'un fil (FK `conversation_id -> conversations`,
  ON DELETE CASCADE), role en enum Postgres `message_role`.
- `chat_actions`  : trace auditable des actions proposees (FK
  `conversation_id -> conversations` et `message_id -> messages`, ON DELETE
  CASCADE ; FK NULLABLE `deployment_id -> deployments`, ON DELETE SET NULL),
  kind/status en enums Postgres `chat_action_kind` / `chat_action_status`,
  arguments en JSONB.

Les types enum sont crees implicitement par `create_table` et retires
explicitement au downgrade (`drop_table` ne supprime pas les types Postgres),
pour un cycle down -> up idempotent. Indexes sur `conversations.owner_id`
(list_by_owner) et `messages.conversation_id` (list_messages).

Revision ID: c4e1a2b3d5f6
Revises: 7d2e4f9a1c8b
Create Date: 2026-06-08 09:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c4e1a2b3d5f6"
down_revision: str | None = "7d2e4f9a1c8b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _message_role() -> sa.Enum:
    return sa.Enum("user", "assistant", "tool", name="message_role")


def _chat_action_kind() -> sa.Enum:
    return sa.Enum("deploy", "stop", "start", "regenerate", name="chat_action_kind")


def _chat_action_status() -> sa.Enum:
    return sa.Enum(
        "proposed",
        "confirmed",
        "rejected",
        "executed",
        "failed",
        name="chat_action_status",
    )


def upgrade() -> None:
    op.create_table(
        "conversations",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["users.id"],
            name=op.f("fk_conversations_owner_id_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_conversations")),
    )
    with op.batch_alter_table("conversations", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_conversations_owner_id"), ["owner_id"], unique=False)

    op.create_table(
        "messages",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("conversation_id", sa.UUID(), nullable=False),
        sa.Column("role", _message_role(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            name=op.f("fk_messages_conversation_id_conversations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_messages")),
    )
    with op.batch_alter_table("messages", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_messages_conversation_id"), ["conversation_id"], unique=False
        )

    op.create_table(
        "chat_actions",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("conversation_id", sa.UUID(), nullable=False),
        sa.Column("message_id", sa.UUID(), nullable=False),
        sa.Column("kind", _chat_action_kind(), nullable=False),
        sa.Column(
            "args",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("status", _chat_action_status(), nullable=False),
        sa.Column("deployment_id", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            name=op.f("fk_chat_actions_conversation_id_conversations"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["message_id"],
            ["messages.id"],
            name=op.f("fk_chat_actions_message_id_messages"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["deployment_id"],
            ["deployments.id"],
            name=op.f("fk_chat_actions_deployment_id_deployments"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_chat_actions")),
    )
    with op.batch_alter_table("chat_actions", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_chat_actions_conversation_id"), ["conversation_id"], unique=False
        )


def downgrade() -> None:
    with op.batch_alter_table("chat_actions", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_chat_actions_conversation_id"))
    op.drop_table("chat_actions")

    with op.batch_alter_table("messages", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_messages_conversation_id"))
    op.drop_table("messages")

    with op.batch_alter_table("conversations", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_conversations_owner_id"))
    op.drop_table("conversations")

    # Les types enum sont crees implicitement par create_table mais ne sont pas
    # supprimes par drop_table : on les retire explicitement pour un downgrade
    # symetrique (idempotence d'un cycle down -> up).
    op.execute("DROP TYPE IF EXISTS chat_action_status")
    op.execute("DROP TYPE IF EXISTS chat_action_kind")
    op.execute("DROP TYPE IF EXISTS message_role")
