"""Use case GetConversation : detail d'un fil possede (avec ses messages)."""

from uuid import UUID

from app.chat.application.conversation_access import load_owned_conversation
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.interfaces.conversation_repository import ConversationRepository


class GetConversation:
    """Renvoie un fil de l'utilisateur (404 si inconnu ou non possede)."""

    def __init__(self, repository: ConversationRepository) -> None:
        self._repository = repository

    async def execute(self, *, conversation_id: UUID, owner_id: UUID) -> Conversation:
        return await load_owned_conversation(self._repository, conversation_id, owner_id)

    async def list_messages(self, *, conversation_id: UUID, owner_id: UUID) -> list[Message]:
        """Renvoie les messages affichables d'un fil possede (apres controle d'appartenance).

        Les messages `tool` (resultats d'outils reinjectes au LLM pour le contexte)
        sont du detail interne : on les exclut du detail presente a l'utilisateur
        pour ne pas afficher de JSON brut. Ils restent persistes et servent toujours
        a reconstruire l'historique du modele (`SendMessage._build_history`).
        """
        await load_owned_conversation(self._repository, conversation_id, owner_id)
        messages = await self._repository.list_messages(conversation_id)
        return [message for message in messages if message.role is not MessageRole.TOOL]
