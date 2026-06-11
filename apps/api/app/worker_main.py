"""Entrypoint du worker arq de deploiement.

Boucle consommateur `arq` (cf. design section 6) qui traite les jobs de la file
`stacknest:deployment` : PROVISION / STOP / START / DESTROY / REGENERATE. Le
worker partage le code domaine + infrastructure avec l'API (meme paquet `app/`)
mais tourne dans un service Docker separe (`worker` dans docker-compose) — il ne
sert aucune API HTTP.

Lancement (cf. docker-compose) :

    arq app.worker_main.WorkerSettings

Cycle de vie des ressources :
- `on_startup` ouvre le client Redis (publisher) et le provisioner Docker
  (cible `settings.docker_host`) une fois pour le process, et prepare un
  executeur de job qui ouvre une session DB *par job* (unit of work).
- `on_shutdown` ferme proprement le client Redis.
"""

from collections.abc import Awaitable, Callable
from typing import Any, ClassVar

import structlog
from arq.connections import RedisSettings
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.catalog.infrastructure.repositories.sqlalchemy_template_repository import (
    SqlAlchemyTemplateRepository,
)
from app.core.config import get_settings

# Enregistre TOUS les modeles ORM (User/Template/Deployment...) sur le metadata
# partage. Indispensable dans cet entrypoint worker autonome : sans cet import,
# les modeles auth/catalog ne sont pas charges et les FK de `deployments`
# (owner_id -> users, template_id -> templates) ne se resolvent pas
# (sqlalchemy NoReferencedTableError). L'API n'a pas ce probleme car elle importe
# tous les routers (donc tous les modeles) au boot.
from app.core.database import models_registry as _models_registry  # noqa: F401
from app.core.database.engine import get_sessionmaker
from app.deployment.domain.interfaces.provisioner import Provisioner
from app.deployment.domain.value_objects.deployment_job import DeploymentJob
from app.deployment.infrastructure.events.redis_event_publisher import RedisEventPublisher
from app.deployment.infrastructure.provisioner.docker_sdk_provisioner import (
    DockerSdkProvisioner,
)
from app.deployment.infrastructure.queue.arq_settings import (
    DEPLOYMENT_JOB_FUNCTION,
    DEPLOYMENT_QUEUE_NAME,
    redis_settings_from_url,
)
from app.deployment.infrastructure.queue.deployment_job_serializer import (
    deserialize_deployment_job,
)
from app.deployment.infrastructure.reader.catalog_template_provisioning_reader import (
    CatalogTemplateProvisioningReader,
)
from app.deployment.infrastructure.repositories.sqlalchemy_deployment_repository import (
    SqlAlchemyDeploymentRepository,
)
from app.deployment.infrastructure.secret.token_secret_generator import (
    TokenSecretGenerator,
)
from app.deployment.worker.deployment_job_handler import DeploymentJobHandler
from app.stack.domain.value_objects.stack_job import StackJob
from app.stack.infrastructure.events.redis_stack_event_publisher import (
    RedisStackEventPublisher,
)
from app.stack.infrastructure.provisioner.compose_cli_provisioner import ComposeCliProvisioner
from app.stack.infrastructure.queue.stack_arq_settings import STACK_JOB_FUNCTION
from app.stack.infrastructure.queue.stack_job_serializer import deserialize_stack_job
from app.stack.infrastructure.repositories.sqlalchemy_stack_repository import (
    SqlAlchemyStackRepository,
)
from app.stack.worker.stack_job_handler import StackJobHandler

_logger = structlog.get_logger(__name__)


async def process_deployment_job(ctx: dict[str, Any], *, kind: str, deployment_id: str) -> None:
    """Fonction worker arq : reconstruit le job et delegue a l'executeur du ctx.

    Le nom de cette fonction (`process_deployment_job`) doit correspondre a celui
    utilise par l'`ArqJobQueue` cote API (`DEPLOYMENT_JOB_FUNCTION`). L'executeur
    (`ctx["execute_job"]`), installe par `on_startup`, gere la session DB et le
    handler — ce qui rend cette fonction triviale et testable.
    """
    job = deserialize_deployment_job({"kind": kind, "deployment_id": deployment_id})
    await ctx["execute_job"](job)


async def process_stack_job(ctx: dict[str, Any], *, kind: str, stack_id: str) -> None:
    """Fonction worker arq des jobs de stack (PROVISION / DESTROY via compose).

    Son nom (`process_stack_job`) doit correspondre a celui utilise par
    l'`ArqStackJobQueue` cote API (`STACK_JOB_FUNCTION`). Delegue a l'executeur de
    stack (`ctx["execute_stack_job"]`) installe par `on_startup`.
    """
    job = deserialize_stack_job({"kind": kind, "stack_id": stack_id})
    await ctx["execute_stack_job"](job)


async def startup(ctx: dict[str, Any]) -> None:
    """Initialise les ressources partagees du worker et les executeurs de job."""
    settings = get_settings()
    redis_client: Redis = Redis.from_url(settings.redis_url, decode_responses=True)
    provisioner = DockerSdkProvisioner.from_docker_host(settings.docker_host)
    compose_provisioner = ComposeCliProvisioner.from_docker_host(settings.docker_host)
    sessionmaker = get_sessionmaker()

    ctx["redis_client"] = redis_client
    ctx["execute_job"] = _make_executor(sessionmaker, redis_client, provisioner)
    ctx["execute_stack_job"] = _make_stack_executor(sessionmaker, redis_client, compose_provisioner)
    _logger.info("worker.started", queue=DEPLOYMENT_QUEUE_NAME)


async def shutdown(ctx: dict[str, Any]) -> None:
    """Ferme proprement les ressources ouvertes au demarrage."""
    redis_client: Redis | None = ctx.get("redis_client")
    if redis_client is not None:
        await redis_client.aclose()
    _logger.info("deployment.worker.stopped")


def _make_executor(
    sessionmaker: async_sessionmaker[AsyncSession],
    redis_client: Redis,
    provisioner: Provisioner,
) -> Any:
    """Construit l'executeur qui ouvre une session par job et delegue au handler.

    Une session DB est ouverte *par job* (unit of work) : repository et reader y
    sont adosses, le handler est instancie avec les ressources partagees
    (provisioner, publisher Redis, generateur de secret), puis on commit.
    """

    async def execute_job(job: DeploymentJob) -> None:
        async with sessionmaker() as session:
            handler = DeploymentJobHandler(
                repository=SqlAlchemyDeploymentRepository(session),
                provisioner=provisioner,
                publisher=RedisEventPublisher(redis_client),
                reader=CatalogTemplateProvisioningReader(SqlAlchemyTemplateRepository(session)),
                secret_generator=TokenSecretGenerator(),
            )
            await handler.handle(job)
            await session.commit()

    return execute_job


def _make_stack_executor(
    sessionmaker: async_sessionmaker[AsyncSession],
    redis_client: Redis,
    provisioner: ComposeCliProvisioner,
) -> Any:
    """Construit l'executeur de jobs de stack (une session DB par job, unit of work).

    Le `StackJobHandler` reutilise le reader de provisioning et le generateur de
    secret du deploiement (image/port/secret_env identiques) ; le compose-file et
    les statuts/events sont specifiques a la stack.
    """

    async def execute_stack_job(job: StackJob) -> None:
        async with sessionmaker() as session:
            handler = StackJobHandler(
                repository=SqlAlchemyStackRepository(session),
                provisioner=provisioner,
                publisher=RedisStackEventPublisher(redis_client),
                reader=CatalogTemplateProvisioningReader(SqlAlchemyTemplateRepository(session)),
                secret_generator=TokenSecretGenerator(),
            )
            await handler.handle(job)
            await session.commit()

    return execute_stack_job


class WorkerSettings:
    """Configuration du worker arq (decouverte par `arq app.worker_main.WorkerSettings`).

    - `functions`     : fonctions worker enregistrees — jobs de deploiement ET de
      stack (un seul worker au MVP, meme file ; arq route par nom de fonction).
    - `queue_name`    : file partagee `stacknest:deployment`.
    - `redis_settings`: connexion Redis derivee de `Settings.redis_url`.
    - `on_startup` / `on_shutdown` : cycle de vie des ressources partagees.
    """

    functions: ClassVar[list[Callable[..., Awaitable[None]]]] = [
        process_deployment_job,
        process_stack_job,
    ]
    queue_name: ClassVar[str] = DEPLOYMENT_QUEUE_NAME
    redis_settings: ClassVar[RedisSettings] = redis_settings_from_url(get_settings().redis_url)
    on_startup: ClassVar[Callable[[dict[str, Any]], Awaitable[None]]] = startup
    on_shutdown: ClassVar[Callable[[dict[str, Any]], Awaitable[None]]] = shutdown


# Noms des fonctions worker : doivent matcher l'enqueue cote API. Verifies ici
# pour echouer tot (a l'import) si producteur et consommateur divergent.
assert process_deployment_job.__name__ == DEPLOYMENT_JOB_FUNCTION
assert process_stack_job.__name__ == STACK_JOB_FUNCTION
