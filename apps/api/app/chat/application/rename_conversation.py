"""Use case RenameConversation : renomme un fil possede."""

from uuid import UUID

from app.chat.application.conversation_access import load_owned_conversation
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.interfaces.conversation_repository import ConversationRepository


class RenameConversation:
    """Renomme un fil de l'utilisateur (404 si inconnu ou non possede).

    Le titre est valide en amont par le schema de presentation (non vide) ; on
    reconstruit neanmoins l'entite pour re-jouer sa guard clause (defense en
    profondeur), un titre vide remontant alors en 422 via le handler global.
    """

    def __init__(self, repository: ConversationRepository) -> None:
        self._repository = repository

    async def execute(self, *, conversation_id: UUID, owner_id: UUID, title: str) -> Conversation:
        conversation = await load_owned_conversation(self._repository, conversation_id, owner_id)
        renamed = Conversation(
            id=conversation.id,
            owner_id=conversation.owner_id,
            title=title.strip(),
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
        )
        return await self._repository.update(renamed)
