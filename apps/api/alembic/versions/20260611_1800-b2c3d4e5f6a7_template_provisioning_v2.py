"""template provisioning v2

Etend le modele de provisioning de la table `templates` avec trois colonnes :
- `command` (JSON nullable) : commande de demarrage du conteneur (liste de tokens),
  null = commande par defaut de l'image (ex. Keycloak : `["start-dev"]`).
- `secret_value_template` (String nullable) : gabarit de la valeur injectee dans
  `secret_env` (placeholder `{secret}`), null = valeur = secret brut (ex. Neo4j :
  `"neo4j/{secret}"`).
- `is_deployable` (Boolean NOT NULL, defaut true) : false masque le template du
  deploiement tout en le laissant visible au catalogue (runtimes langage).

`command`/`secret_value_template` sont nullables (templates existants valides) et
`is_deployable` a un server_default `true` (idem). Le downgrade retire
symetriquement les trois colonnes.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-11 18:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: str | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("templates", schema=None) as batch_op:
        batch_op.add_column(sa.Column("command", sa.JSON(), nullable=True))
        batch_op.add_column(
            sa.Column("secret_value_template", sa.String(length=255), nullable=True)
        )
        batch_op.add_column(
            sa.Column(
                "is_deployable",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("true"),
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("templates", schema=None) as batch_op:
        batch_op.drop_column("is_deployable")
        batch_op.drop_column("secret_value_template")
        batch_op.drop_column("command")
