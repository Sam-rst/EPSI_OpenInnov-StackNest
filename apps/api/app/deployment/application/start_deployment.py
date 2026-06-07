"""Use case StartDeployment : redemarre un deploiement arrete."""

from uuid import UUID

from app.deployment.application.deployment_access import load_owned_deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository
from app.deployment.domain.interfaces.job_queue import JobQueue
from app.deployment.domain.services.deployment_state_machine import DeploymentStateMachine
from app.deployment.domain.value_objects.deployment_job import DeploymentJob


class StartDeployment:
    """Verifie l'owner et la transition `stopped -> running` puis enfile un START.

    Le redemarrage reel est asynchrone : 404 si le deploiement est absent ou non
    possede, 409 si la transition est illegale (ex. deja running). Le worker
    realise le `docker start` et persiste le nouvel etat + port republie.
    """

    def __init__(self, *, repository: DeploymentRepository, queue: JobQueue) -> None:
        self._repository = repository
        self._queue = queue

    async def execute(self, deployment_id: UUID, owner_id: UUID) -> None:
        deployment = await load_owned_deployment(self._repository, deployment_id, owner_id)
        DeploymentStateMachine.ensure_can_transition(deployment.status, DeploymentStatus.RUNNING)
        await self._queue.enqueue(DeploymentJob(kind=JobKind.START, deployment_id=deployment.id))
