"""Modele ORM SQLAlchemy de la table `templates`."""

from uuid import UUID

from sqlalchemy import Boolean, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.catalog.domain.enums.template_category import TemplateCategory
from app.core.database.base import Base
from app.core.database.pg_enum import pg_enum
from app.core.database.timestamp_mixin import TimestampMixin


class TemplateModel(TimestampMixin, Base):
    """Table `templates` : fiche d'une ressource provisionnable du catalogue.

    - `id`       : UUID genere cote base (`gen_random_uuid()`).
    - `slug`     : identifiant lisible et unique (utilise dans les URLs).
    - `category` : enum Postgres `template_category`.
    - `tags`     : tableau de libelles libres (text[]) pour la recherche.
    - `is_active`: masque un template du catalogue sans le supprimer (defaut true).
    """

    __tablename__ = "templates"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    icon: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[TemplateCategory] = mapped_column(
        pg_enum(TemplateCategory, name="template_category"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    popular: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default=text("'{}'::text[]")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
