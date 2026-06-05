"""Fabrique de l'`AsyncEngine` et de l'`async_sessionmaker` partages.

Un seul moteur (pool de connexions) par process : il est memoize via
`@lru_cache`. Le moteur est cree paresseusement a la premiere demande pour
ne pas ouvrir de connexion a l'import (les tests unit n'ont pas de DB).

L'URL provient de `Settings.database_url` (env var `DATABASE_URL`).
"""

from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings


@lru_cache
def get_engine() -> AsyncEngine:
    """Renvoie l'`AsyncEngine` unique du process (cree au premier appel)."""
    settings = get_settings()
    return create_async_engine(settings.database_url, pool_pre_ping=True)


@lru_cache
def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    """Renvoie la fabrique de sessions liee au moteur unique (memoizee).

    `expire_on_commit=False` : on garde les attributs accessibles apres
    commit (pratique pour serialiser une entite juste apres l'avoir persistee
    sans recharger depuis la base).
    """
    return async_sessionmaker(bind=get_engine(), expire_on_commit=False)
