"""Modele ORM SQLAlchemy de la table `stack_links`."""

from uuid import UUID

from sqlalchemy import ForeignKey, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base


class StackLinkModel(Base):
    """Table `stack_links` : lien dirige entre deux services d'une stack.

    - `id`              : UUID genere cote base (`gen_random_uuid()`).
    - `stack_id`        : FK vers `stacks.id` (ON DELETE CASCADE), indexee pour
      `list_links`.
    - `from_service_id` : FK vers `stack_services.id` (consommateur), CASCADE.
    - `to_service_id`   : FK vers `stack_services.id` (fournisseur), CASCADE.
    - `var_mappings`    : mapping `{ ENV_VAR : expression }` serialise en JSONB.

    La cascade sur les FK service garantit que supprimer un service emporte les
    liens qui le referencent (l'integrite du graphe est preservee). L'absence de
    cycle est validee applicativement (lot 2).
    """

    __tablename__ = "stack_links"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    stack_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("stacks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_service_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("stack_services.id", ondelete="CASCADE"),
        nullable=False,
    )
    to_service_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("stack_services.id", ondelete="CASCADE"),
        nullable=False,
    )
    var_mappings: Mapped[dict[str, str]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
