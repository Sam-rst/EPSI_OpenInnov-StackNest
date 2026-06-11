"""Composition root du slice stack : providers FastAPI des dependances.

Construit les implementations concretes des ports du domaine a partir des
ressources de la requete / du process :

- `StackRepository` est adosse a la session de la requete ;
- `StackTemplateReader` lit le catalogue via son repository (verification des
  templates a l'ajout + cles des params secret pour le masquage) ;
- `StackJobQueue` enfile via un pool `arq` (Redis) ouvert paresseusement une
  fois par process et memoize ;
- `StackEventSubscriber` consomme le pub/sub Redis via le client partage du core.

Tous les providers sont surchargeables par les tests via `app.dependency_overrides`
(faux en memoire), sans Redis ni base reels.
"""

from typing import Annotated

from arq.connections import ArqRedis, create_pool
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.infrastructure.repositories.sqlalchemy_template_repository import (
    SqlAlchemyTemplateRepository,
)
from app.core.config import Settings, get_settings
from app.core.database.request_session import get_request_session
from app.core.redis.redis_client import get_redis_client
from app.stack.domain.interfaces.stack_event_subscriber import StackEventSubscriber
from app.stack.domain.interfaces.stack_job_queue import StackJobQueue
from app.stack.domain.interfaces.stack_repository import StackRepository
from app.stack.domain.interfaces.stack_template_reader import StackTemplateReader
from app.stack.infrastructure.events.redis_stack_event_subscriber import (
    RedisStackEventSubscriber,
)
from app.stack.infrastructure.queue.arq_stack_job_queue import ArqStackJobQueue
from app.stack.infrastructure.queue.stack_arq_settings import stack_redis_settings_from_url
from app.stack.infrastructure.reader.catalog_stack_template_reader import (
    CatalogStackTemplateReader,
)
from app.stack.infrastructure.repositories.sqlalchemy_stack_repository import (
    SqlAlchemyStackRepository,
)

# Pool arq partage par le process, ouvert a la premiere demande. `create_pool`
# etant asynchrone, on ne peut pas memoizer via lru_cache : on garde la reference
# au niveau module et on la cree paresseusement (un seul pool par process).
_arq_pool: ArqRedis | None = None


def get_stack_repository(
    session: Annotated[AsyncSession, Depends(get_request_session)],
) -> StackRepository:
    """Provider du depot de stacks adosse a la session de la requete."""
    return SqlAlchemyStackRepository(session)


def get_stack_template_reader(
    session: Annotated[AsyncSession, Depends(get_request_session)],
) -> StackTemplateReader:
    """Provider du reader catalogue (gate d'ajout + cles secret) par requete."""
    return CatalogStackTemplateReader(SqlAlchemyTemplateRepository(session))


async def get_stack_arq_pool(settings: Annotated[Settings, Depends(get_settings)]) -> ArqRedis:
    """Renvoie le pool arq partage (cree paresseusement une fois par process)."""
    global _arq_pool
    if _arq_pool is None:
        _arq_pool = await create_pool(stack_redis_settings_from_url(settings.redis_url))
    return _arq_pool


def get_stack_job_queue(pool: Annotated[ArqRedis, Depends(get_stack_arq_pool)]) -> StackJobQueue:
    """Provider de la file de jobs de stack (enfilage arq sur Redis)."""
    return ArqStackJobQueue(pool)


def get_stack_event_subscriber(
    settings: Annotated[Settings, Depends(get_settings)],
) -> StackEventSubscriber:
    """Provider de l'abonne aux events de stack (Redis pub/sub partage)."""
    return RedisStackEventSubscriber(get_redis_client(settings.redis_url))
