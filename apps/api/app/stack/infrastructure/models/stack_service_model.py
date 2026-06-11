"""Modele ORM SQLAlchemy de la table `stack_services`."""

from typing import Any
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base
from app.core.database.pg_enum import pg_enum
from app.stack.domain.enums.service_status import ServiceStatus


class StackServiceModel(Base):
    """Table `stack_services` : un service membre d'une stack.

    - `id`              : UUID genere cote base (`gen_random_uuid()`).
    - `stack_id`        : FK vers `stacks.id` (ON DELETE CASCADE : supprimer une
      stack emporte ses services), indexee pour `list_services`.
    - `template_id`     : FK vers `templates.id` (template du catalogue source).
    - `version`         : libelle de version choisi (ex. `16`).
    - `alias`           : nom du service dans la stack (cle compose / DNS).
    - `params`          : valeurs de provisioning serialisees en JSONB.
    - `published_port`  : port publie sur l'hote (NULL avant le run).
    - `container_ref`   : reference du conteneur cree (NULL avant le run).
    - `service_status`  : enum Postgres `service_status` (etat du service).
    - `order_index`     : ordre d'affichage / d'ajout dans la stack.

    Contrainte d'unicite `(stack_id, alias)` : un alias est unique au sein
    d'une stack (mais reutilisable d'une stack a l'autre). La FK `template_id`
    n'utilise pas de cascade (preservation de l'historique du catalogue).
    """

    __tablename__ = "stack_services"
    __table_args__ = (
        UniqueConstraint("stack_id", "alias", name="uq_stack_services_stack_id_alias"),
    )

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
    template_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("templates.id"),
        nullable=False,
    )
    version: Mapped[str] = mapped_column(String(60), nullable=False)
    alias: Mapped[str] = mapped_column(String(60), nullable=False)
    params: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    published_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    container_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    service_status: Mapped[ServiceStatus] = mapped_column(
        pg_enum(ServiceStatus, name="service_status"),
        nullable=False,
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
