"""Interface (port) de publication d'evenements de stack."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.stack.domain.value_objects.stack_event import StackEvent


class StackEventPublisher(ABC):
    """Contrat de diffusion des evenements de cycle de vie d'une stack.

    Implemente en infrastructure par un adaptateur Redis pub/sub (canal
    `stack:{id}`, cf. spec SSE — meme pattern que le deploiement). Le worker
    publie les transitions (provisioning, running, partial, failed, ... au niveau
    stack et par service) consommees par le flux SSE de l'API.
    """

    @abstractmethod
    async def publish(self, stack_id: UUID, event: StackEvent) -> None:
        """Publie un evenement sur le canal de la stack."""
