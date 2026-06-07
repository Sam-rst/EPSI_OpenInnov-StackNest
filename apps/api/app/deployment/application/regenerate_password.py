"""Use case RegeneratePassword : regenere le secret d'un deploiement existant."""

from uuid import UUID

from app.deployment.application.deployment_access import load_owned_deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.exceptions.invalid_deployment_state import (
    InvalidDeploymentStateException,
)
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository
from app.deployment.domain.interfaces.job_queue import JobQueue
from app.deployment.domain.value_objects.deployment_job import DeploymentJob

# Etats ou un conteneur existe et peut etre recree avec un nouveau secret.
# La regeneration n'est pas une transition d'etat (le deploiement reste
# running/stopped) : le guard porte donc sur la presence d'un conteneur, pas sur
# la machine a etats.
_REGENERATABLE_STATUSES = frozenset({DeploymentStatus.RUNNING, DeploymentStatus.STOPPED})


class RegeneratePassword:
    """Verifie l'owner et l'existence d'un conteneur puis enfile un REGENERATE.

    La regeneration recree le conteneur avec un nouveau secret (cf. design
    section 7, risques) : elle n'a de sens que sur un deploiement deja provisionne
    (`running` ou `stopped`). Sinon (pending/provisioning/failed/destroyed) -> 409.
    Le secret est genere au traitement du job par le worker, jamais ici.
    """

    def __init__(self, *, repository: DeploymentRepository, queue: JobQueue) -> None:
        self._repository = repository
        self._queue = queue

    async def execute(self, deployment_id: UUID, owner_id: UUID) -> None:
        deployment = await load_owned_deployment(self._repository, deployment_id, owner_id)
        if deployment.status not in _REGENERATABLE_STATUSES:
            raise InvalidDeploymentStateException(
                f"Regeneration impossible depuis l'etat {deployment.status.value}."
            )
        await self._queue.enqueue(
            DeploymentJob(kind=JobKind.REGENERATE, deployment_id=deployment.id)
        )
