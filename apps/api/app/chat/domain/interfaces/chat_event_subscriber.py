"""Interface (port) d'abonnement aux evenements d'une conversation (SSE)."""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from uuid import UUID

from app.chat.domain.value_objects.chat_event import ChatEvent


class ChatEventSubscriber(ABC):
    """Contrat d'abonnement au flux d'evenements d'une conversation.

    Implemente en infrastructure par un adaptateur Redis pub/sub (canal
    `chat:{conversation_id}`). L'endpoint SSE consomme l'`AsyncIterator` : chaque
    event recu est re-emis au client en trame `text/event-stream`. Pendant
    superieur au `ChatEventPublisher` (cote diffusion), reutilise le meme
    mecanisme que le flux SSE du deploiement.
    """

    @abstractmethod
    def subscribe(self, conversation_id: UUID) -> AsyncIterator[ChatEvent]:
        """Renvoie un flux asynchrone des evenements de la conversation."""
