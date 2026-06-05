"""Ping bas niveau de la base : `SELECT 1` avec conversion d'erreur typee.

Brique reutilisable (health, readiness probe, scripts) qui execute la
requete la plus simple possible et convertit toute panne infrastructure en
`DatabaseUnavailableException`. Conforme a la politique : try/except sur
l'infrastructure uniquement, cause originale preservee via `raise ... from`.
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.exceptions.database_unavailable_exception import (
    DatabaseUnavailableException,
)

_PING_STATEMENT = text("SELECT 1")


async def check_database(session: AsyncSession) -> None:
    """Execute `SELECT 1`. Leve `DatabaseUnavailableException` si la base est down."""
    try:
        await session.execute(_PING_STATEMENT)
    except Exception as err:
        raise DatabaseUnavailableException(f"Database ping failed: {err}") from err
