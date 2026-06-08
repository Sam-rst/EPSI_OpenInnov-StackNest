"""Use case ListConversations : liste les fils d'un utilisateur (isolation owner)."""

from uuid import UUID

from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.interfaces.conversation_repository import ConversationRepository


class ListConversations:
    """Renvoie les fils appartenant a l'utilisateur (pour la sidebar)."""

    def __init__(self, repository: ConversationRepository) -> None:
        self._repository = repository

    async def execute(self, owner_id: UUID) -> list[Conversation]:
        return await self._repository.list_by_owner(owner_id)
