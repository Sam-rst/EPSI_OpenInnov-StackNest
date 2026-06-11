"""Interface (port) de la file de jobs asynchrones de stack."""

from abc import ABC, abstractmethod

from app.stack.domain.value_objects.stack_job import StackJob


class StackJobQueue(ABC):
    """Contrat d'enfilage des jobs de stack vers le worker.

    Implemente en infrastructure par un adaptateur `arq` (Redis). `CreateStack`
    enfile un `StackJob` PROVISION apres avoir persiste la stack ; `DestroyStack`
    enfile un job DESTROY. Le worker les consomme de facon asynchrone (retries,
    concurrence geres par l'implementation).
    """

    @abstractmethod
    async def enqueue(self, job: StackJob) -> None:
        """Enfile le job pour traitement asynchrone par le worker."""
