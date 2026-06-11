"""template params env var

Ajoute la colonne `env_var` (nullable) a la table `template_params` : elle porte
la variable d'environnement du conteneur recevant la valeur du parametre
(ex. `POSTGRES_DB`). Nullable et sans valeur par defaut : les parametres existants
restent valides (None = aucun mapping d'env). Le downgrade retire symetriquement
la colonne.

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-06-11 16:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "f1a2b3c4d5e6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("template_params", schema=None) as batch_op:
        batch_op.add_column(sa.Column("env_var", sa.String(length=120), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("template_params", schema=None) as batch_op:
        batch_op.drop_column("env_var")
