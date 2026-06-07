"""Use case DestroyDeployment : detruit un deploiement (running ou stopped)."""

from uuid import UUID

from app.deployment.application.deployment_access import load_owned_deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository
from app.deployment.domain.interfaces.job_queue import JobQueue
from app.deployment.domain.services.deployment_state_machine import DeploymentStateMachine
from app.deployment.domain.value_objects.deployment_job import DeploymentJob


class DestroyDeployment:
    """Verifie l'owner et la transition `* -> destroying` puis enfile un DESTROY.

    La destruction reelle est asynchrone : 404 si le deploiement est absent ou
    non possede, 409 si deja detruit/en echec (etat terminal). Le worker realise
    le `docker rm -f` + cleanup et persiste l'etat `destroyed`.
    """

    def __init__(self, *, repository: DeploymentRepository, queue: JobQueue) -> None:
        self._repository = repository
        self._queue = queue

    async def execute(self, deployment_id: UUID, owner_id: UUID) -> None:
        deployment = await load_owned_deployment(self._repository, deployment_id, owner_id)
        DeploymentStateMachine.ensure_can_transition(deployment.status, DeploymentStatus.DESTROYING)
        await self._queue.enqueue(DeploymentJob(kind=JobKind.DESTROY, deployment_id=deployment.id))
