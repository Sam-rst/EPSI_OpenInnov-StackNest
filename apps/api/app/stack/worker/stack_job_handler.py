"""Handler des jobs de stack consommes par le worker arq.

Orchestre le cycle de vie reel d'un projet `docker compose` (cf. spec
« Provisioning »). Chaque job recharge la stack et ses membres depuis le
repository, genere le compose-file, appelle le `StackProvisioner` (CLI compose),
persiste l'etat (port publie + reference de conteneur + statuts) et publie des
events sur le canal `stack:{id}` (niveau stack + par service). Toute defaillance
d'infrastructure bascule la stack en `failed` + event `failed` (try/except sur
l'infra uniquement).

Securite (cf. spec section « Securite ») : le secret de chaque service qui en
declare un est genere ici, injecte UNIQUEMENT dans l'environnement du conteneur
(via le compose-file), jamais persiste en base ni diffuse en event/SSE.
"""

import structlog

from app.deployment.domain.interfaces.secret_generator import SecretGenerator
from app.deployment.domain.interfaces.template_provisioning_reader import (
    TemplateProvisioningReader,
)
from app.deployment.domain.value_objects.template_provisioning import TemplateProvisioning
from app.stack.domain.entities.stack import Stack
from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_job_kind import StackJobKind
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.interfaces.stack_event_publisher import StackEventPublisher
from app.stack.domain.interfaces.stack_provisioner import StackProvisioner
from app.stack.domain.interfaces.stack_repository import StackRepository
from app.stack.domain.services.compose_builder import ComposeBuilder
from app.stack.domain.services.stack_status_aggregator import aggregate_stack_status
from app.stack.domain.value_objects.service_provision_result import ServiceProvisionResult
from app.stack.domain.value_objects.stack_event import StackEvent
from app.stack.domain.value_objects.stack_job import StackJob

_logger = structlog.get_logger(__name__)


class StackJobHandler:
    """Traite un `StackJob` en orchestrant repository, provisioner compose et events.

    Dependances injectees (toutes via interfaces du domaine) : rend le handler
    testable avec des fakes. La fabrique `process_stack_job` (worker_main)
    construit ce handler depuis le contexte arq.
    """

    def __init__(
        self,
        *,
        repository: StackRepository,
        provisioner: StackProvisioner,
        publisher: StackEventPublisher,
        reader: TemplateProvisioningReader,
        secret_generator: SecretGenerator,
        builder: ComposeBuilder | None = None,
    ) -> None:
        self._repository = repository
        self._provisioner = provisioner
        self._publisher = publisher
        self._reader = reader
        self._secret_generator = secret_generator
        self._builder = builder or ComposeBuilder()

    async def handle(self, job: StackJob) -> None:
        """Charge la stack puis dispatche le traitement selon le type de job."""
        stack = await self._repository.get_by_id(job.stack_id)
        if stack is None:
            _logger.warning("stack.job.orphan", stack_id=str(job.stack_id))
            return
        if job.kind is StackJobKind.PROVISION:
            await self._provision(stack)
        else:
            await self._destroy(stack)

    async def _provision(self, stack: Stack) -> None:
        await self._transition(stack, StackStatus.PROVISIONING)
        try:
            services = await self._repository.list_services(stack.id)
            results = await self._run_compose_up(stack, services)
        except Exception as error:  # frontiere infra : on bascule en failed
            await self._mark_failed(stack, error)
            return
        await self._apply_results(stack, services, results)

    async def _run_compose_up(
        self, stack: Stack, services: list[StackService]
    ) -> list[ServiceProvisionResult]:
        """Construit le compose-file (secrets generes) puis lance `compose up`."""
        provisioning_by_alias = await self._resolve_provisioning(services)
        secret_by_alias = self._generate_secrets(services, provisioning_by_alias)
        links = await self._repository.list_links(stack.id)
        compose_file = self._builder.build(
            stack_id=stack.id,
            services=services,
            links=links,
            provisioning_by_alias=provisioning_by_alias,
            secret_by_alias=secret_by_alias,
        )
        return await self._provisioner.up(compose_file)

    async def _resolve_provisioning(
        self, services: list[StackService]
    ) -> dict[str, TemplateProvisioning]:
        """Charge le descripteur catalogue de chaque service (par alias)."""
        provisioning_by_alias: dict[str, TemplateProvisioning] = {}
        for service in services:
            descriptor = await self._reader.get(service.template_id, service.version)
            if descriptor is None:
                raise ValueError(
                    f"Descripteur de provisioning absent pour le service « {service.alias} »."
                )
            provisioning_by_alias[service.alias] = descriptor
        return provisioning_by_alias

    def _generate_secrets(
        self,
        services: list[StackService],
        provisioning_by_alias: dict[str, TemplateProvisioning],
    ) -> dict[str, str | None]:
        """Genere un secret par service qui en declare un (sinon None)."""
        return {
            service.alias: (
                self._secret_generator.generate()
                if provisioning_by_alias[service.alias].requires_secret()
                else None
            )
            for service in services
        }

    async def _apply_results(
        self,
        stack: Stack,
        services: list[StackService],
        results: list[ServiceProvisionResult],
    ) -> None:
        """Persiste port/ref/statut par service, agrege et publie les events."""
        results_by_alias = {result.alias: result for result in results}
        for service in services:
            await self._update_service(service, results_by_alias.get(service.alias))
        stack.status = aggregate_stack_status([service.service_status for service in services])
        await self._repository.update_stack(stack)
        await self._publisher.publish(stack.id, StackEvent(stack_status=stack.status))

    async def _update_service(
        self, service: StackService, result: ServiceProvisionResult | None
    ) -> None:
        """Met a jour un service (running + acces) ou le marque failed si absent."""
        if result is None:
            service.service_status = ServiceStatus.FAILED
            await self._repository.update_service(service)
            await self._publish_service(service, access_url=None)
            return
        service.service_status = ServiceStatus.RUNNING
        service.published_port = result.published_port
        service.container_ref = result.container_ref
        await self._repository.update_service(service)
        await self._publish_service(service, access_url=self._access_url(result))

    @staticmethod
    def _access_url(result: ServiceProvisionResult) -> str | None:
        """`host:port` publie du service, ou None s'il ne publie aucun port."""
        if result.published_port is None:
            return None
        return f"{result.host}:{result.published_port}"

    async def _destroy(self, stack: Stack) -> None:
        await self._transition(stack, StackStatus.DESTROYING)
        try:
            await self._provisioner.down(f"stack_{stack.id}")
        except Exception as error:  # frontiere infra : on bascule en failed
            await self._mark_failed(stack, error)
            return
        await self._mark_services_destroyed(stack)
        await self._transition(stack, StackStatus.DESTROYED)

    async def _mark_services_destroyed(self, stack: Stack) -> None:
        """Passe chaque service en `destroyed` (le projet compose est detruit)."""
        for service in await self._repository.list_services(stack.id):
            service.service_status = ServiceStatus.DESTROYED
            await self._repository.update_service(service)

    async def _transition(self, stack: Stack, status: StackStatus) -> None:
        """Persiste un changement de statut global puis publie l'event de stack."""
        stack.status = status
        await self._repository.update_stack(stack)
        await self._publisher.publish(stack.id, StackEvent(stack_status=status))

    async def _publish_service(self, service: StackService, *, access_url: str | None) -> None:
        """Publie un event de niveau service (statut + acces), jamais de secret."""
        await self._publisher.publish(
            service.stack_id,
            StackEvent(
                stack_status=StackStatus.PROVISIONING,
                alias=service.alias,
                service_status=service.service_status,
                access_url=access_url,
            ),
        )

    async def _mark_failed(self, stack: Stack, error: Exception) -> None:
        """Bascule la stack en `failed` + event (sans divulguer de secret)."""
        _logger.error("stack.job.failed", stack_id=str(stack.id), error=str(error))
        stack.status = StackStatus.FAILED
        await self._repository.update_stack(stack)
        await self._publisher.publish(
            stack.id,
            StackEvent(stack_status=StackStatus.FAILED, message=str(error)),
        )
