"""Interface (port) de publication d'evenements de deploiement."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.deployment.domain.value_objects.deployment_event import DeploymentEvent


class EventPublisher(ABC):
    """Contrat de diffusion des evenements de cycle de vie d'un deploiement.

    Implemente en infrastructure par un adaptateur Redis pub/sub (canal
    `deployment:{id}`, cf. design decision 7). Le worker publie les transitions
    (provisioning, running, stopped, ...) consommees par le flux SSE de l'API.
    """

    @abstractmethod
    async def publish(self, deployment_id: UUID, event: DeploymentEvent) -> None:
        """Publie un evenement sur le canal du deploiement."""
