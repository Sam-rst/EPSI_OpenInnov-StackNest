"""Handler des jobs de deploiement consommes par le worker arq.

Orchestre le cycle de vie reel d'un conteneur (cf. design sections 6-7). Chaque
job recharge le `Deployment` depuis le repository, appelle le `Provisioner`
(Docker SDK), persiste le nouvel etat et publie un event sur le canal
`deployment:{id}`. Toute defaillance d'infrastructure bascule le deploiement en
`failed` + event `failed` (try/except sur l'infra uniquement).

Securite (cf. design section 8) : le secret est genere ici au PROVISION (et a la
regeneration), injecte dans l'env du conteneur via la factory, et diffuse une
seule fois dans l'event `running` — jamais persiste en base ni loggue.
"""

import structlog

from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.factories.container_spec_factory import ContainerSpecFactory
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository
from app.deployment.domain.interfaces.event_publisher import EventPublisher
from app.deployment.domain.interfaces.provisioner import Provisioner
from app.deployment.domain.interfaces.secret_generator import SecretGenerator
from app.deployment.domain.interfaces.template_provisioning_reader import (
    TemplateProvisioningReader,
)
from app.deployment.domain.value_objects.container_spec import ContainerSpec
from app.deployment.domain.value_objects.deployment_event import DeploymentEvent
from app.deployment.domain.value_objects.deployment_job import DeploymentJob
from app.deployment.domain.value_objects.provision_result import ProvisionResult
from app.deployment.domain.value_objects.template_provisioning import TemplateProvisioning

_logger = structlog.get_logger(__name__)

_CONTAINER_REF_KEY = "container_ref"

# Nombre maximal de lignes de log diffusees au passage `running` : un simple tail
# (cf. retours QC #10), pas un streaming continu. Suffit a alimenter le panneau
# Logs de l'UI sans surcharger le flux SSE.
_LOG_TAIL_LINES = 50


class DeploymentJobHandler:
    """Traite un `DeploymentJob` en orchestrant repository, provisioner et events.

    Dependances injectees (toutes via interfaces du domaine) : rend le handler
    testable avec des fakes. La fabrique `process_deployment_job` (worker_main)
    construit ce handler depuis le contexte arq.
    """

    def __init__(
        self,
        *,
        repository: DeploymentRepository,
        provisioner: Provisioner,
        publisher: EventPublisher,
        reader: TemplateProvisioningReader,
        secret_generator: SecretGenerator,
    ) -> None:
        self._repository = repository
        self._provisioner = provisioner
        self._publisher = publisher
        self._reader = reader
        self._secret_generator = secret_generator

    async def handle(self, job: DeploymentJob) -> None:
        """Charge le deploiement puis dispatche le traitement selon le type de job."""
        deployment = await self._repository.get_by_id(job.deployment_id)
        if deployment is None:
            _logger.warning("deployment.job.orphan", deployment_id=str(job.deployment_id))
            return
        await self._dispatch(job.kind, deployment)

    async def _dispatch(self, kind: JobKind, deployment: Deployment) -> None:
        handlers = {
            JobKind.PROVISION: self._provision,
            JobKind.STOP: self._stop,
            JobKind.START: self._start,
            JobKind.DESTROY: self._destroy,
            JobKind.REGENERATE: self._regenerate,
        }
        await handlers[kind](deployment)

    async def _provision(self, deployment: Deployment) -> None:
        await self._transition(deployment, DeploymentStatus.PROVISIONING)
        try:
            descriptor = await self._require_descriptor(deployment)
            secret = self._generate_secret(descriptor)
            spec = self._build_spec(deployment, descriptor, secret)
            result = await self._provisioner.create(spec)
        except Exception as error:  # frontiere infra : on bascule en failed
            await self._mark_failed(deployment, error)
            return
        await self._mark_running(deployment, result, secret)

    async def _stop(self, deployment: Deployment) -> None:
        try:
            await self._provisioner.stop(self._container_ref(deployment))
        except Exception as error:  # frontiere infra : on bascule en failed
            await self._mark_failed(deployment, error)
            return
        await self._transition(deployment, DeploymentStatus.STOPPED)

    async def _start(self, deployment: Deployment) -> None:
        try:
            result = await self._provisioner.start(self._container_ref(deployment))
        except Exception as error:  # frontiere infra : on bascule en failed
            await self._mark_failed(deployment, error)
            return
        await self._mark_running(deployment, result, secret=None)

    async def _destroy(self, deployment: Deployment) -> None:
        await self._transition(deployment, DeploymentStatus.DESTROYING)
        try:
            await self._provisioner.destroy(self._container_ref(deployment))
        except Exception as error:  # frontiere infra : on bascule en failed
            await self._mark_failed(deployment, error)
            return
        await self._transition(deployment, DeploymentStatus.DESTROYED)

    async def _regenerate(self, deployment: Deployment) -> None:
        try:
            descriptor = await self._require_descriptor(deployment)
            secret = self._generate_secret(descriptor)
            spec = self._build_spec(deployment, descriptor, secret)
            result = await self._provisioner.recreate(spec, self._container_ref(deployment))
        except Exception as error:  # frontiere infra : on bascule en failed
            await self._mark_failed(deployment, error)
            return
        await self._mark_running(deployment, result, secret)

    async def _require_descriptor(self, deployment: Deployment) -> TemplateProvisioning:
        descriptor = await self._reader.get(deployment.template_id, deployment.template_version)
        if descriptor is None:
            raise ValueError(
                f"Descripteur de provisioning absent pour le template "
                f"{deployment.template_id} version {deployment.template_version}."
            )
        return descriptor

    def _generate_secret(self, descriptor: TemplateProvisioning) -> str | None:
        """Genere un secret uniquement si le template en declare un."""
        if not descriptor.requires_secret():
            return None
        return self._secret_generator.generate()

    def _build_spec(
        self, deployment: Deployment, descriptor: TemplateProvisioning, secret: str | None
    ) -> ContainerSpec:
        return ContainerSpecFactory.build(
            image_repository=descriptor.image_repository or "",
            version=deployment.template_version,
            internal_port=descriptor.internal_port,
            secret_env=descriptor.secret_env,
            params=deployment.params,
            secret=secret,
            deployment_id=str(deployment.id),
        )

    async def _mark_running(
        self, deployment: Deployment, result: ProvisionResult, secret: str | None
    ) -> None:
        """Persiste host/port/ref + statut running, puis publie l'event (secret une fois)."""
        deployment.status = DeploymentStatus.RUNNING
        deployment.host = result.host
        deployment.published_port = result.port
        deployment.params = {**deployment.params, _CONTAINER_REF_KEY: result.container_ref}
        await self._repository.update(deployment)
        access_url = f"{result.host}:{result.port}"
        await self._publisher.publish(
            deployment.id,
            DeploymentEvent(status=DeploymentStatus.RUNNING, access_url=access_url, secret=secret),
        )
        await self._publish_logs(deployment, result.container_ref)

    async def _publish_logs(self, deployment: Deployment, container_ref: str) -> None:
        """Diffuse un tail des logs du conteneur (best-effort, jamais bloquant).

        Lecture des logs = I/O infra : un echec ne doit PAS faire echouer le job
        (le deploiement reste `running`). On ne publie un event que si le tail
        contient effectivement des lignes (pas de message vide).
        """
        try:
            output = await self._provisioner.logs(container_ref)
        except Exception as error:  # frontiere infra : logs best-effort
            _logger.warning(
                "deployment.job.logs_unavailable",
                deployment_id=str(deployment.id),
                error=str(error),
            )
            return
        tail = self._tail(output)
        if not tail:
            return
        await self._publisher.publish(
            deployment.id,
            DeploymentEvent(status=DeploymentStatus.RUNNING, message=tail),
        )

    @staticmethod
    def _tail(output: str) -> str:
        """Renvoie les dernieres lignes non vides du log, sans depasser la limite."""
        lines = [line for line in output.splitlines() if line.strip()]
        return "\n".join(lines[-_LOG_TAIL_LINES:])

    async def _transition(self, deployment: Deployment, status: DeploymentStatus) -> None:
        """Persiste un changement de statut sans metadonnees puis publie l'event."""
        deployment.status = status
        await self._repository.update(deployment)
        await self._publisher.publish(deployment.id, DeploymentEvent(status=status))

    async def _mark_failed(self, deployment: Deployment, error: Exception) -> None:
        """Bascule le deploiement en `failed` + event (sans divulguer le secret)."""
        _logger.error(
            "deployment.job.failed",
            deployment_id=str(deployment.id),
            error=str(error),
        )
        deployment.status = DeploymentStatus.FAILED
        await self._repository.update(deployment)
        await self._publisher.publish(
            deployment.id,
            DeploymentEvent(status=DeploymentStatus.FAILED, message=str(error)),
        )

    @staticmethod
    def _container_ref(deployment: Deployment) -> str:
        """Lit la reference du conteneur stockee dans les params, sinon leve."""
        container_ref = deployment.params.get(_CONTAINER_REF_KEY)
        if not isinstance(container_ref, str) or not container_ref:
            raise ValueError(f"Reference de conteneur absente pour le deploiement {deployment.id}.")
        return container_ref
