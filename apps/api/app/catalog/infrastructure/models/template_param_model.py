"""Modele ORM SQLAlchemy de la table `template_params`."""

from typing import Any
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.catalog.domain.enums.param_type import ParamType
from app.core.database.base import Base
from app.core.database.pg_enum import pg_enum


class TemplateParamModel(Base):
    """Table `template_params` : parametres de provisioning d'un template.

    - `template_id`   : FK -> templates, ON DELETE CASCADE.
    - `type`          : enum Postgres `param_type` (pilote le rendu du formulaire).
    - `default_value` : valeur par defaut (texte, nullable).
    - `options`       : choix possibles pour un parametre `select` (JSONB, nullable).
    - `order_index`   : ordre d'affichage dans le formulaire.
    - `env_var`       : variable d'environnement du conteneur recevant la valeur
      du parametre (ex. `POSTGRES_DB`), ou `NULL` si aucune (port, memoire...).
    """

    __tablename__ = "template_params"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    template_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    key: Mapped[str] = mapped_column(String(120), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[ParamType] = mapped_column(pg_enum(ParamType, name="param_type"), nullable=False)
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    default_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    options: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    env_var: Mapped[str | None] = mapped_column(String(120), nullable=True)
