"""Use case CreateConversation : ouvre un nouveau fil de discussion."""

from uuid import UUID, uuid4

from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.interfaces.conversation_repository import ConversationRepository

# Titre par defaut d'un fil cree sans libelle (renommable ensuite par l'UI).
_DEFAULT_TITLE = "Nouvelle conversation"


class CreateConversation:
    """Cree un fil appartenant a l'utilisateur courant puis le renvoie."""

    def __init__(self, repository: ConversationRepository) -> None:
        self._repository = repository

    async def execute(self, *, owner_id: UUID, title: str | None) -> Conversation:
        resolved_title = title.strip() if title and title.strip() else _DEFAULT_TITLE
        conversation = Conversation(id=uuid4(), owner_id=owner_id, title=resolved_title)
        return await self._repository.add(conversation)
