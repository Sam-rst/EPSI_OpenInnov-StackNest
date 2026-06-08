"""Composition root du slice deploiement : providers FastAPI des dependances.

Construit les implementations concretes des ports du domaine a partir des
ressources de la requete / du process :

- `DeploymentRepository` et `TemplateProvisioningReader` sont adosses a la
  session DB de la requete (unit of work par requete, comme le catalogue).
- `JobQueue` enfile via un pool `arq` (Redis) ouvert paresseusement une fois par
  process et memoize.
- `EventSubscriber` consomme le pub/sub Redis via le client partage du core.

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
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository
from app.deployment.domain.interfaces.event_subscriber import EventSubscriber
from app.deployment.domain.interfaces.job_queue import JobQueue
from app.deployment.domain.interfaces.template_provisioning_reader import (
    TemplateProvisioningReader,
)
from app.deployment.infrastructure.events.redis_event_subscriber import RedisEventSubscriber
from app.deployment.infrastructure.queue.arq_job_queue import ArqJobQueue
from app.deployment.infrastructure.queue.arq_settings import redis_settings_from_url
from app.deployment.infrastructure.reader.catalog_template_provisioning_reader import (
    CatalogTemplateProvisioningReader,
)
from app.deployment.infrastructure.repositories.sqlalchemy_deployment_repository import (
    SqlAlchemyDeploymentRepository,
)

# Pool arq partage par le process, ouvert a la premiere demande. `create_pool`
# etant asynchrone, on ne peut pas memoizer via lru_cache : on garde la reference
# au niveau module et on la cree paresseusement (un seul pool par process).
_arq_pool: ArqRedis | None = None


def get_deployment_repository(
    session: Annotated[AsyncSession, Depends(get_request_session)],
) -> DeploymentRepository:
    """Provider du depot de deploiements adosse a la session de la requete."""
    return SqlAlchemyDeploymentRepository(session)


def get_template_provisioning_reader(
    session: Annotated[AsyncSession, Depends(get_request_session)],
) -> TemplateProvisioningReader:
    """Provider du reader catalogue (descripteur de provisioning) par requete."""
    return CatalogTemplateProvisioningReader(SqlAlchemyTemplateRepository(session))


async def get_arq_pool(settings: Annotated[Settings, Depends(get_settings)]) -> ArqRedis:
    """Renvoie le pool arq partage (cree paresseusement une fois par process)."""
    global _arq_pool
    if _arq_pool is None:
        _arq_pool = await create_pool(redis_settings_from_url(settings.redis_url))
    return _arq_pool


def get_job_queue(pool: Annotated[ArqRedis, Depends(get_arq_pool)]) -> JobQueue:
    """Provider de la file de jobs (enfilage arq sur Redis)."""
    return ArqJobQueue(pool)


def get_event_subscriber(
    settings: Annotated[Settings, Depends(get_settings)],
) -> EventSubscriber:
    """Provider de l'abonne aux events de deploiement (Redis pub/sub partage)."""
    return RedisEventSubscriber(get_redis_client(settings.redis_url))
