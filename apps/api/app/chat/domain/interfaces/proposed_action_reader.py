"""Interface (port) de lecture des propositions d'action rejouables d'un fil."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.chat.domain.value_objects.proposed_action import ProposedAction


class ProposedActionReader(ABC):
    """Contrat de lecture des propositions encore `proposed` d'une conversation.

    Consomme par le use case `GetConversation` pour rejouer, au rechargement d'un
    fil, la carte d'action attachee a son message d'amorce. L'implementation
    d'infrastructure reconstruit le `recap` PUBLIC (sans secret) a partir de la
    `ChatAction` persistee, comme l'event SSE `action_proposed` l'exposait.
    """

    @abstractmethod
    async def list_proposed(self, conversation_id: UUID) -> list[ProposedAction]:
        """Renvoie les propositions encore `proposed` du fil (recap public, sans secret)."""
