"""tables stack composeur

Cree les 3 tables de la slice Stack (composeur docker compose) :
- `stacks`         : projet multi-services d'un utilisateur (FK `owner_id ->
  users`), statut en enum Postgres `stack_status`.
- `stack_services` : services membres d'une stack (FK `stack_id -> stacks`,
  ON DELETE CASCADE ; FK `template_id -> templates`), statut en enum Postgres
  `service_status`, params en JSONB, contrainte d'unicite `(stack_id, alias)`.
- `stack_links`    : liens diriges entre deux services (FK `stack_id -> stacks`
  et `from_service_id` / `to_service_id -> stack_services`, ON DELETE CASCADE),
  var_mappings en JSONB.

Les types enum sont crees implicitement par `create_table` et retires
explicitement au downgrade (`drop_table` ne supprime pas les types Postgres),
pour un cycle down -> up idempotent. Indexes sur `stacks.owner_id`
(list_by_owner), `stack_services.stack_id` (list_services) et
`stack_links.stack_id` (list_links).

Revision ID: f1a2b3c4d5e6
Revises: e7f0a1b2c3d4
Create Date: 2026-06-11 14:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: str | None = "e7f0a1b2c3d4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _stack_status() -> sa.Enum:
    return sa.Enum(
        "pending",
        "provisioning",
        "running",
        "partial",
        "failed",
        "destroying",
        "destroyed",
        name="stack_status",
    )


def _service_status() -> sa.Enum:
    return sa.Enum(
        "pending",
        "provisioning",
        "running",
        "failed",
        "destroyed",
        name="service_status",
    )


def upgrade() -> None:
    op.create_table(
        "stacks",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("status", _stack_status(), nullable=False),
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
            name=op.f("fk_stacks_owner_id_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_stacks")),
    )
    with op.batch_alter_table("stacks", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_stacks_owner_id"), ["owner_id"], unique=False)

    op.create_table(
        "stack_services",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("stack_id", sa.UUID(), nullable=False),
        sa.Column("template_id", sa.UUID(), nullable=False),
        sa.Column("version", sa.String(length=60), nullable=False),
        sa.Column("alias", sa.String(length=60), nullable=False),
        sa.Column(
            "params",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("published_port", sa.Integer(), nullable=True),
        sa.Column("container_ref", sa.String(length=255), nullable=True),
        sa.Column("service_status", _service_status(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["stack_id"],
            ["stacks.id"],
            name=op.f("fk_stack_services_stack_id_stacks"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["templates.id"],
            name=op.f("fk_stack_services_template_id_templates"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_stack_services")),
        sa.UniqueConstraint("stack_id", "alias", name="uq_stack_services_stack_id_alias"),
    )
    with op.batch_alter_table("stack_services", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_stack_services_stack_id"), ["stack_id"], unique=False)

    op.create_table(
        "stack_links",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("stack_id", sa.UUID(), nullable=False),
        sa.Column("from_service_id", sa.UUID(), nullable=False),
        sa.Column("to_service_id", sa.UUID(), nullable=False),
        sa.Column(
            "var_mappings",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["stack_id"],
            ["stacks.id"],
            name=op.f("fk_stack_links_stack_id_stacks"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["from_service_id"],
            ["stack_services.id"],
            name=op.f("fk_stack_links_from_service_id_stack_services"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["to_service_id"],
            ["stack_services.id"],
            name=op.f("fk_stack_links_to_service_id_stack_services"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_stack_links")),
    )
    with op.batch_alter_table("stack_links", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_stack_links_stack_id"), ["stack_id"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("stack_links", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_stack_links_stack_id"))
    op.drop_table("stack_links")

    with op.batch_alter_table("stack_services", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_stack_services_stack_id"))
    op.drop_table("stack_services")

    with op.batch_alter_table("stacks", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_stacks_owner_id"))
    op.drop_table("stacks")

    # Les types enum sont crees implicitement par create_table mais ne sont pas
    # supprimes par drop_table : on les retire explicitement pour un downgrade
    # symetrique (idempotence d'un cycle down -> up).
    op.execute("DROP TYPE IF EXISTS service_status")
    op.execute("DROP TYPE IF EXISTS stack_status")
