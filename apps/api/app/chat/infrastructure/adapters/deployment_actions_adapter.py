"""Adaptateur du port DeploymentActions : delegue aux use cases de deploiement.

A la confirmation d'une action de chat, `ConfirmAction` appelle ce port. L'unique
role de l'adaptateur est de traduire l'appel en invocation des use cases REELS du
slice `deployment` (`CreateDeployment`, `StopDeployment`, `StartDeployment`,
`RegeneratePassword`) — AUCUNE duplication de la logique de provisioning. Les
controles (existence, appartenance, transition, moteur) restent ceux des use
cases ; leurs exceptions metier remontent telles quelles (404 / 409 via le
handler global). Le secret n'est jamais manipule ici (genere au worker).
"""

from typing import Any
from uuid import UUID

from app.chat.domain.interfaces.deployment_actions import DeploymentActions
from app.deployment.application.commands.create_deployment_command import (
    CreateDeploymentCommand,
)
from app.deployment.application.create_deployment import CreateDeployment
from app.deployment.application.regenerate_password import RegeneratePassword
from app.deployment.application.start_deployment import StartDeployment
from app.deployment.application.stop_deployment import StopDeployment
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository
from app.deployment.domain.interfaces.job_queue import JobQueue
from app.deployment.domain.interfaces.template_provisioning_reader import (
    TemplateProvisioningReader,
)


class DeploymentActionsAdapter(DeploymentActions):
    """Delegue les actions de chat aux use cases existants du slice deploiement."""

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

    async def deploy(
        self,
        *,
        owner_id: UUID,
        template_id: UUID,
        version: str,
        name: str,
        params: dict[str, Any],
    ) -> str:
        command = CreateDeploymentCommand(
            owner_id=owner_id,
            template_id=template_id,
            template_version=version,
            name=name,
            params=params,
        )
        deployment = await CreateDeployment(
            repository=self._repository, queue=self._queue, reader=self._reader
        ).execute(command)
        return str(deployment.id)

    async def stop(self, *, owner_id: UUID, deployment_id: UUID) -> str:
        await StopDeployment(repository=self._repository, queue=self._queue).execute(
            deployment_id, owner_id
        )
        return str(deployment_id)

    async def start(self, *, owner_id: UUID, deployment_id: UUID) -> str:
        await StartDeployment(repository=self._repository, queue=self._queue).execute(
            deployment_id, owner_id
        )
        return str(deployment_id)

    async def regenerate_password(self, *, owner_id: UUID, deployment_id: UUID) -> str:
        await RegeneratePassword(repository=self._repository, queue=self._queue).execute(
            deployment_id, owner_id
        )
        return str(deployment_id)
