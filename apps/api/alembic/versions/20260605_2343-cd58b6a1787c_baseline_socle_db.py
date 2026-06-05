"""baseline socle db

Migration de base (vide) du socle StackNest. Etablit un head unique et la
table `alembic_version` sur une base neuve. Les tables metier seront
ajoutees par les tickets feature suivants (auth, catalog, ...).

Revision ID: cd58b6a1787c
Revises:
Create Date: 2026-06-05 23:43:53.300699

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "cd58b6a1787c"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Baseline : aucune table metier a ce stade."""


def downgrade() -> None:
    """Baseline : rien a defaire."""
