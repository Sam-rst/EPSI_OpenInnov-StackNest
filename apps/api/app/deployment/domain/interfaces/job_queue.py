"""Interface (port) de la file de jobs asynchrones de deploiement."""

from abc import ABC, abstractmethod

from app.deployment.domain.value_objects.deployment_job import DeploymentJob


class JobQueue(ABC):
    """Contrat d'enfilage des jobs de deploiement vers le worker.

    Implemente en infrastructure par un adaptateur `arq` (Redis, cf. design
    decision 6). Les use cases enfilent un `DeploymentJob` apres avoir persiste la
    transition d'etat; le worker les consomme de facon asynchrone (retries,
    concurrence geres par l'implementation).
    """

    @abstractmethod
    async def enqueue(self, job: DeploymentJob) -> None:
        """Enfile le job pour traitement asynchrone par le worker."""
