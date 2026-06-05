"""Dependance FastAPI fournissant une `AsyncSession` par requete.

Politique transactionnelle (unit of work par requete) :

- une session est ouverte au debut de la requete,
- `commit()` si le handler se termine sans erreur,
- `rollback()` si une exception remonte,
- `close()` systematiquement (libere la connexion vers le pool).

Injectable via `Depends(get_session)`. La factory de sessions est un
parametre (defaut : le sessionmaker global memoize) pour permettre aux
tests d'injecter un faux sessionmaker sans toucher a une vraie base.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.database.engine import get_sessionmaker


async def get_session(
    session_factory: async_sessionmaker[AsyncSession] | None = None,
) -> AsyncGenerator[AsyncSession]:
    """Yield une `AsyncSession` avec gestion commit/rollback/close.

    Le `close()` final est assure par le `async with` (le sessionmaker ferme
    la session a la sortie du contexte), on ne le rappelle donc pas a la main
    pour ne pas double-fermer.
    """
    factory = session_factory or get_sessionmaker()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
