"""Modele ORM SQLAlchemy de la table `deployments`."""

from typing import Any
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base
from app.core.database.pg_enum import pg_enum
from app.core.database.timestamp_mixin import TimestampMixin
from app.deployment.domain.enums.deployment_status import DeploymentStatus


class DeploymentModel(TimestampMixin, Base):
    """Table `deployments` : ressource Docker provisionnee par un utilisateur.

    - `id`               : UUID genere cote base (`gen_random_uuid()`).
    - `owner_id`         : FK vers `users.id` (proprietaire, isolation des acces),
      indexee pour `list_by_owner`.
    - `template_id`      : FK vers `templates.id` (template du catalogue source).
    - `template_version` : libelle de version choisi (ex. `16`).
    - `status`           : enum Postgres `deployment_status` (machine a etats).
    - `params`           : valeurs de provisioning serialisees en JSONB.
    - `host`             : hote d'execution une fois provisionne (NULL avant).
    - `published_port`   : port publie sur l'hote (NULL avant le run).

    Les FK n'utilisent pas de cascade : la suppression d'un utilisateur ou d'un
    template est bloquee tant qu'un deploiement les reference (preservation de
    l'historique des ressources).
    """

    __tablename__ = "deployments"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    owner_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    template_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("templates.id"),
        nullable=False,
    )
    template_version: Mapped[str] = mapped_column(String(60), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[DeploymentStatus] = mapped_column(
        pg_enum(DeploymentStatus, name="deployment_status"),
        nullable=False,
    )
    params: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    host: Mapped[str | None] = mapped_column(String(255), nullable=True)
    published_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
