"""Interface (port) de publication d'evenements de chat (SSE)."""

from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID


class ChatEventPublisher(ABC):
    """Contrat de diffusion des evenements d'une conversation (streaming SSE).

    Implemente en infrastructure par un adaptateur Redis pub/sub (canal
    `chat:{conversation_id}`, cf. design) reutilisant l'infra du deploiement. Le
    use case `SendMessage` (vague 2) publie les fragments (`token`), les messages
    completes, les propositions d'action (`action_proposed`) et les resultats
    (`action_result`) consommes par le flux SSE de l'API.

    L'evenement est decrit par un nom (`event`) et une charge utile serialisable
    (`payload`) : ce port reste agnostique de la forme exacte des evenements,
    figee par la presentation en vague 2.
    """

    @abstractmethod
    async def publish(
        self,
        conversation_id: UUID,
        event: str,
        payload: dict[str, Any],
    ) -> None:
        """Publie un evenement nomme sur le canal de la conversation."""
