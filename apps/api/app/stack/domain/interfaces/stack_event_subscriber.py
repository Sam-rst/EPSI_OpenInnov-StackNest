"""Interface (port) d'abonnement aux evenements de stack."""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from uuid import UUID

from app.stack.domain.value_objects.stack_event import StackEvent


class StackEventSubscriber(ABC):
    """Contrat d'abonnement au flux d'evenements d'une stack.

    Implemente en infrastructure par un adaptateur Redis pub/sub (canal
    `stack:{id}`). L'endpoint SSE de l'API consomme l'iterateur asynchrone
    renvoye par `subscribe` pour pousser chaque evenement au client tant que la
    connexion reste ouverte.
    """

    @abstractmethod
    def subscribe(self, stack_id: UUID) -> AsyncIterator[StackEvent]:
        """Renvoie un flux asynchrone des evenements publies sur la stack."""
