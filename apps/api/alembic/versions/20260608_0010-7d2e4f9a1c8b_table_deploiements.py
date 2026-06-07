"""table deploiements

Cree la table `deployments` : ressource Docker provisionnee par un utilisateur a
partir d'un template du catalogue. Le statut suit la machine a etats du cycle de
vie (enum Postgres `deployment_status`), les valeurs de provisioning sont
stockees en JSONB. Les FK `owner_id -> users.id` et `template_id -> templates.id`
garantissent l'integrite referentielle sans cascade (preservation de
l'historique). Un index sur `owner_id` sert `list_by_owner`.

Le type enum `deployment_status` est cree implicitement par `create_table` (cf.
`da2a3d3e781e` pour le socle). Il est retire explicitement au downgrade
(`drop_table` ne supprime pas les types Postgres), pour un cycle down -> up
idempotent (sans quoi le type subsisterait et le re-upgrade echouerait).

Revision ID: 7d2e4f9a1c8b
Revises: 3012f3cdc8be
Create Date: 2026-06-08 00:10:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7d2e4f9a1c8b"
down_revision: str | None = "3012f3cdc8be"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _deployment_status() -> sa.Enum:
    return sa.Enum(
        "pending",
        "provisioning",
        "running",
        "stopped",
        "failed",
        "destroying",
        "destroyed",
        name="deployment_status",
    )


def upgrade() -> None:
    op.create_table(
        "deployments",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.Column("template_id", sa.UUID(), nullable=False),
        sa.Column("template_version", sa.String(length=60), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("status", _deployment_status(), nullable=False),
        sa.Column(
            "params",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("host", sa.String(length=255), nullable=True),
        sa.Column("published_port", sa.Integer(), nullable=True),
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
            name=op.f("fk_deployments_owner_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["templates.id"],
            name=op.f("fk_deployments_template_id_templates"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_deployments")),
    )
    with op.batch_alter_table("deployments", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_deployments_owner_id"), ["owner_id"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("deployments", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_deployments_owner_id"))

    op.drop_table("deployments")

    # Le type enum est cree implicitement par create_table mais n'est pas
    # supprime par drop_table : on le retire explicitement pour un downgrade
    # symetrique (idempotence d'un cycle down -> up).
    op.execute("DROP TYPE IF EXISTS deployment_status")
