"""Use case DeleteConversation : supprime un fil possede (cascade messages)."""

from uuid import UUID

from app.chat.application.conversation_access import load_owned_conversation
from app.chat.domain.interfaces.conversation_repository import ConversationRepository


class DeleteConversation:
    """Supprime un fil de l'utilisateur (404 si inconnu ou non possede).

    La suppression emporte ses messages et actions (cascade ON DELETE au niveau
    base). On controle d'abord l'appartenance pour ne pas divulguer l'existence
    d'un fil d'autrui.
    """

    def __init__(self, repository: ConversationRepository) -> None:
        self._repository = repository

    async def execute(self, *, conversation_id: UUID, owner_id: UUID) -> None:
        await load_owned_conversation(self._repository, conversation_id, owner_id)
        await self._repository.delete(conversation_id)
