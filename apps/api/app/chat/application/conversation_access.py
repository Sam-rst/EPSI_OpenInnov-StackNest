"""Chargement d'une conversation avec controle d'autorisation par proprietaire.

Helper applicatif partage par les use cases du chat (`SendMessage`,
`GetConversation`, `RenameConversation`, ...) : factorise « charger par id puis
verifier l'appartenance ». Une conversation inexistante OU appartenant a un autre
utilisateur leve la meme 404 (`ConversationNotFoundException`) : on ne divulgue
pas son existence (cf. isolation par owner).
"""

from uuid import UUID

from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.exceptions.conversation_not_found import ConversationNotFoundException
from app.chat.domain.interfaces.conversation_repository import ConversationRepository


async def load_owned_conversation(
    repository: ConversationRepository, conversation_id: UUID, owner_id: UUID
) -> Conversation:
    """Charge la conversation de cet owner, ou leve `ConversationNotFoundException`."""
    conversation = await repository.get_by_id(conversation_id)
    if conversation is None or conversation.owner_id != owner_id:
        raise ConversationNotFoundException()
    return conversation
