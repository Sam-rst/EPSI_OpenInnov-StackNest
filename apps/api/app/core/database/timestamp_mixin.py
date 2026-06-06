"""Mixin ORM ajoutant des colonnes de timestamps gerees par la base.

`created_at` et `updated_at` sont positionnees cote base (server_default
`now()`) pour rester coherentes meme si une insertion contourne l'ORM
(migration de donnees, requete brute). `updated_at` est rafraichie a chaque
UPDATE via `onupdate`.
"""

from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column


class TimestampMixin:
    """Colonnes `created_at` / `updated_at` (timestamptz) gerees cote base."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
