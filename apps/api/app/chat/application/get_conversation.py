"""Use case GetConversation : detail d'un fil possede (avec ses messages)."""

from uuid import UUID

from app.chat.application.conversation_access import load_owned_conversation
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.interfaces.conversation_repository import ConversationRepository


class GetConversation:
    """Renvoie un fil de l'utilisateur (404 si inconnu ou non possede)."""

    def __init__(self, repository: ConversationRepository) -> None:
        self._repository = repository

    async def execute(self, *, conversation_id: UUID, owner_id: UUID) -> Conversation:
        return await load_owned_conversation(self._repository, conversation_id, owner_id)

    async def list_messages(self, *, conversation_id: UUID, owner_id: UUID) -> list[Message]:
        """Renvoie les messages d'un fil possede (apres controle d'appartenance)."""
        await load_owned_conversation(self._repository, conversation_id, owner_id)
        return await self._repository.list_messages(conversation_id)
