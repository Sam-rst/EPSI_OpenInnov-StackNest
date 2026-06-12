"""chat action kind compose_stack

Ajoute la valeur `compose_stack` a l'enum Postgres `chat_action_kind` : le chat
peut desormais proposer de COMPOSER une stack multi-services (en plus de deployer
un service unique). La trace de l'action (table `chat_actions`) est typee par cet
enum ; sa structure (services + liens) est portee par la colonne JSONB `args`
existante — aucune nouvelle colonne n'est requise. Le `stack_id` de la stack
creee n'est PAS persiste dans la colonne FK `deployment_id` (qui pointe vers
`deployments`) : il transite uniquement par l'event SSE `action_result`.

`ALTER TYPE ... ADD VALUE` n'est PAS reversible directement en Postgres (pas de
`DROP VALUE`). Le downgrade recree donc le type sans `compose_stack` en
re-typant la colonne `kind` (USING cast), ce qui suppose qu'aucune ligne ne porte
encore cette valeur. Garde-fous : `ADD VALUE IF NOT EXISTS` rend l'upgrade
idempotent (cycle down -> up rejouable).

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-12 09:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: str | None = "b2c3d4e5f6a7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_ENUM_NAME = "chat_action_kind"
_NEW_VALUE = "compose_stack"
_BASE_VALUES = ("deploy", "stop", "start", "regenerate")


def upgrade() -> None:
    # Idempotent : ne re-ajoute pas la valeur si un cycle down -> up l'a deja posee.
    op.execute(f"ALTER TYPE {_ENUM_NAME} ADD VALUE IF NOT EXISTS '{_NEW_VALUE}'")


def downgrade() -> None:
    # Postgres n'offre pas de DROP VALUE : on recree l'enum sans `compose_stack`.
    # Suppose qu'aucune `chat_actions.kind` ne vaut `compose_stack` (sinon le cast
    # echouerait, ce qui est le comportement attendu : on ne perd pas de donnee).
    base = ", ".join(f"'{value}'" for value in _BASE_VALUES)
    op.execute(f"ALTER TYPE {_ENUM_NAME} RENAME TO {_ENUM_NAME}_old")
    op.execute(f"CREATE TYPE {_ENUM_NAME} AS ENUM ({base})")
    op.execute(
        f"ALTER TABLE chat_actions ALTER COLUMN kind "
        f"TYPE {_ENUM_NAME} USING kind::text::{_ENUM_NAME}"
    )
    op.execute(f"DROP TYPE {_ENUM_NAME}_old")
