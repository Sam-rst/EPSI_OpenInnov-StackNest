"""Modele ORM SQLAlchemy de la table `template_versions`."""

from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, func, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base


class TemplateVersionModel(Base):
    """Table `template_versions` : versions disponibles d'un template.

    - `template_id` : FK -> templates, ON DELETE CASCADE (supprimer un template
      supprime ses versions). Indexee pour les lookups par template.
    - `is_default`  : version proposee par defaut.
    - `is_lts`      : version a support long terme.
    - `eol_date`    : date de fin de vie (nullable).
    """

    __tablename__ = "template_versions"

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
    version: Mapped[str] = mapped_column(String(60), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    is_lts: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    eol_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
