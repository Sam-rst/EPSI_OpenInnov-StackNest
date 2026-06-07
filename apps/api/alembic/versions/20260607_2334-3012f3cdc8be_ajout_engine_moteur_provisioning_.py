"""ajout engine moteur provisioning templates

Ajoute la colonne `engine` a la table `templates` : discriminateur du moteur de
provisioning (`docker` | `terraform`). Colonne NOT NULL avec `server_default`
`'docker'` — les templates existants sont backfills sur Docker, le moteur par
defaut.

Le type enum Postgres `engine_kind` est cree explicitement (l'`Enum` SQLAlchemy
de la colonne porte `create_type=False` pour ne pas le creer une seconde fois).
Le downgrade retire la colonne puis le type, pour un cycle down -> up idempotent
(sans quoi le type subsisterait et le re-upgrade echouerait).

Revision ID: 3012f3cdc8be
Revises: b1aab4b3a2b9
Create Date: 2026-06-07 23:34:30.868448

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3012f3cdc8be"
down_revision: str | None = "b1aab4b3a2b9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _engine_kind(*, create_type: bool) -> sa.Enum:
    return sa.Enum("docker", "terraform", name="engine_kind", create_type=create_type)


def upgrade() -> None:
    # Cree explicitement le type enum, puis ajoute la colonne sans relancer sa
    # creation (`create_type=False`), pour eviter un double CREATE TYPE.
    _engine_kind(create_type=True).create(op.get_bind(), checkfirst=True)
    with op.batch_alter_table("templates", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "engine",
                _engine_kind(create_type=False),
                nullable=False,
                server_default=sa.text("'docker'"),
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("templates", schema=None) as batch_op:
        batch_op.drop_column("engine")
    _engine_kind(create_type=True).drop(op.get_bind(), checkfirst=True)
