"""Use case CreateDeployment : lance le provisioning d'une ressource du catalogue."""

from uuid import uuid4

from app.deployment.application.commands.create_deployment_command import (
    CreateDeploymentCommand,
)
from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.exceptions.engine_not_supported import (
    EngineNotSupportedException,
)
from app.deployment.domain.exceptions.template_not_found import (
    TemplateNotFoundForDeploymentException,
)
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository
from app.deployment.domain.interfaces.job_queue import JobQueue
from app.deployment.domain.interfaces.template_provisioning_reader import (
    TemplateProvisioningReader,
)
from app.deployment.domain.value_objects.deployment_job import DeploymentJob


class CreateDeployment:
    """Cree un deploiement `pending` puis enfile son provisioning asynchrone.

    Valide d'abord que le template existe (port de lecture du catalogue) et que
    son moteur est `docker` (gate moteur, cf. design section 12) — un template
    Terraform est rejete. Le secret n'est PAS genere ici : il le sera au PROVISION
    par le worker, jamais persiste en clair (cf. design section 8). Le job enfile
    ne transporte que `{kind, deployment_id}`.
    """

    def __init__(
        self,
        *,
        repository: DeploymentRepository,
        queue: JobQueue,
        reader: TemplateProvisioningReader,
    ) -> None:
        self._repository = repository
        self._queue = queue
        self._reader = reader

    async def execute(self, command: CreateDeploymentCommand) -> Deployment:
        provisioning = await self._reader.get(command.template_id, command.template_version)
        if provisioning is None:
            raise TemplateNotFoundForDeploymentException()
        if not provisioning.is_docker():
            raise EngineNotSupportedException()

        deployment = Deployment(
            id=uuid4(),
            owner_id=command.owner_id,
            template_id=command.template_id,
            template_version=command.template_version,
            name=command.name,
            status=DeploymentStatus.PENDING,
            params=dict(command.params),
        )
        persisted = await self._repository.add(deployment)
        await self._queue.enqueue(DeploymentJob(kind=JobKind.PROVISION, deployment_id=persisted.id))
        return persisted
