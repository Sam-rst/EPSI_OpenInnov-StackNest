"""Interface (port) d'abonnement aux evenements de deploiement."""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from uuid import UUID

from app.deployment.domain.value_objects.deployment_event import DeploymentEvent


class EventSubscriber(ABC):
    """Contrat d'abonnement au flux d'evenements d'un deploiement.

    Implemente en infrastructure par un adaptateur Redis pub/sub (canal
    `deployment:{id}`). L'endpoint SSE de l'API consomme l'iterateur asynchrone
    renvoye par `subscribe` pour pousser chaque evenement au client tant que la
    connexion reste ouverte.
    """

    @abstractmethod
    def subscribe(self, deployment_id: UUID) -> AsyncIterator[DeploymentEvent]:
        """Renvoie un flux asynchrone des evenements publies sur le deploiement."""
