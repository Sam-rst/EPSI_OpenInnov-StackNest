"""Dependance FastAPI fournissant une session de base par requete.

`get_session` (dans session.py) expose un parametre `session_factory` optionnel
pratique pour les tests, mais que FastAPI tenterait d'injecter comme parametre
de requete. Ce wrapper presente une signature sans parametre, propre a etre
utilisee via `Depends(get_request_session)` dans les routers et dependances.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_session


async def get_request_session() -> AsyncGenerator[AsyncSession]:
    """Yield la session de la requete (delegue a `get_session`, sans parametre)."""
    async for session in get_session():
        yield session
