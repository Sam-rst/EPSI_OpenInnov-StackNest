"""messages.created_at en clock_timestamp

Un tour de chat persiste plusieurs messages (user, assistant, tool) dans la MEME
transaction applicative. Le defaut `now()` renvoie l'heure de DEBUT de
transaction (constante sur toute la transaction) : les messages d'un meme tour
recevaient donc des `created_at` identiques, rendant `ORDER BY created_at` non
deterministe (« messages dans le desordre » au rechargement).

On bascule le defaut de `messages.created_at` sur `clock_timestamp()`, evalue a
chaque insertion -> horodatage reel distinct par message, ordre de relecture
stable et chronologique. Seul le DEFAULT change ; les lignes existantes ne sont
pas reecrites (le repository les departage par `id`, ordre stable).

Revision ID: e7f0a1b2c3d4
Revises: c4e1a2b3d5f6
Create Date: 2026-06-10 11:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e7f0a1b2c3d4"
down_revision: str | None = "c4e1a2b3d5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "messages",
        "created_at",
        server_default=sa.text("clock_timestamp()"),
    )


def downgrade() -> None:
    op.alter_column(
        "messages",
        "created_at",
        server_default=sa.text("now()"),
    )
