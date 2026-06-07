"""ajout descripteur provisioning templates

Ajoute le descripteur de provisioning a la table `templates` : trois colonnes
nullables (`image_repository`, `internal_port`, `secret_env`) exploitees par la
future feature deploiement pour construire un conteneur Docker. Toutes nullables :
aucune valeur par defaut, les templates existants restent valides (None). Le
downgrade retire symetriquement les trois colonnes.

Revision ID: b1aab4b3a2b9
Revises: da2a3d3e781e
Create Date: 2026-06-07 22:21:46.293483

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b1aab4b3a2b9"
down_revision: str | None = "da2a3d3e781e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("templates", schema=None) as batch_op:
        batch_op.add_column(sa.Column("image_repository", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("internal_port", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("secret_env", sa.String(length=120), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("templates", schema=None) as batch_op:
        batch_op.drop_column("secret_env")
        batch_op.drop_column("internal_port")
        batch_op.drop_column("image_repository")
