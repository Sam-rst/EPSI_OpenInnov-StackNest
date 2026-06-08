"""Chargement d'une action de chat avec controle d'autorisation par proprietaire.

Une `ChatAction` n'a pas d'`owner_id` propre : son appartenance se deduit de la
conversation parente. Ce helper recharge l'action, puis la conversation, et
verifie l'owner. Action inexistante, conversation d'autrui ou action deja
terminee (non `proposed`) levent la meme 404 (`ChatActionNotFoundException`) :
on ne divulgue pas l'existence d'une ressource ni ne re-execute une action.
"""

from uuid import UUID

from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.domain.exceptions.chat_action_not_found import ChatActionNotFoundException
from app.chat.domain.interfaces.chat_action_repository import ChatActionRepository
from app.chat.domain.interfaces.conversation_repository import ConversationRepository


async def load_pending_owned_action(
    *,
    actions: ChatActionRepository,
    conversations: ConversationRepository,
    action_id: UUID,
    owner_id: UUID,
) -> ChatAction:
    """Charge l'action `proposed` de cet owner, ou leve `ChatActionNotFoundException`."""
    action = await actions.get_by_id(action_id)
    if action is None or action.status is not ActionStatus.PROPOSED:
        raise ChatActionNotFoundException()
    conversation = await conversations.get_by_id(action.conversation_id)
    if conversation is None or conversation.owner_id != owner_id:
        raise ChatActionNotFoundException()
    return action
