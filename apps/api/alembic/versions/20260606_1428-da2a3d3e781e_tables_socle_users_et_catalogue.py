"""tables socle users et catalogue

Cree les tables du socle partage (auth + catalogue) sur une base portant deja
la baseline vide. Genere par `--autogenerate` depuis les modeles ORM, puis
ajuste a la main : le downgrade DROP explicitement les types enum Postgres
(`user_role`, `template_category`, `param_type`) qu'Alembic cree implicitement
au create_table mais ne supprime pas au drop_table — sans quoi un cycle
downgrade -> upgrade echouerait (le type existe deja).

Revision ID: da2a3d3e781e
Revises: cd58b6a1787c
Create Date: 2026-06-06 14:28:29.692262

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "da2a3d3e781e"
down_revision: str | None = "cd58b6a1787c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "templates",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("icon", sa.String(length=120), nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "database",
                "cache",
                "runtime",
                "storage",
                "vm",
                "network",
                "observability",
                "security",
                "ai",
                name="template_category",
            ),
            nullable=False,
        ),
        sa.Column("provider", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("popular", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.Text()),
            server_default=sa.text("'{}'::text[]"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
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
        sa.PrimaryKeyConstraint("id", name=op.f("pk_templates")),
    )
    with op.batch_alter_table("templates", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_templates_slug"), ["slug"], unique=True)

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("user", "admin", name="user_role"),
            server_default="user",
            nullable=False,
        ),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("token_version", sa.Integer(), server_default=sa.text("0"), nullable=False),
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
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    )
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_users_email"), ["email"], unique=True)

    op.create_table(
        "template_params",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("template_id", sa.UUID(), nullable=False),
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column(
            "type",
            sa.Enum("string", "int", "bool", "select", "secret", name="param_type"),
            nullable=False,
        ),
        sa.Column("required", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("default_value", sa.Text(), nullable=True),
        sa.Column("options", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("order_index", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["templates.id"],
            name=op.f("fk_template_params_template_id_templates"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_template_params")),
    )
    with op.batch_alter_table("template_params", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_template_params_template_id"), ["template_id"], unique=False
        )

    op.create_table(
        "template_versions",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("template_id", sa.UUID(), nullable=False),
        sa.Column("version", sa.String(length=60), nullable=False),
        sa.Column("is_default", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("is_lts", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("eol_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["templates.id"],
            name=op.f("fk_template_versions_template_id_templates"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_template_versions")),
    )
    with op.batch_alter_table("template_versions", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_template_versions_template_id"), ["template_id"], unique=False
        )


def downgrade() -> None:
    with op.batch_alter_table("template_versions", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_template_versions_template_id"))

    op.drop_table("template_versions")
    with op.batch_alter_table("template_params", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_template_params_template_id"))

    op.drop_table("template_params")
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_users_email"))

    op.drop_table("users")
    with op.batch_alter_table("templates", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_templates_slug"))

    op.drop_table("templates")

    # Les types enum sont crees implicitement par create_table mais ne sont pas
    # supprimes par drop_table : on les retire explicitement pour un downgrade
    # symetrique (idempotence d'un cycle down -> up).
    op.execute("DROP TYPE IF EXISTS param_type")
    op.execute("DROP TYPE IF EXISTS template_category")
    op.execute("DROP TYPE IF EXISTS user_role")
