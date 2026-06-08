"""Use case RejectAction : refuse une proposition d'action (etat terminal)."""

from uuid import UUID

from app.chat.application.action_access import load_pending_owned_action
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.domain.interfaces.chat_action_repository import ChatActionRepository
from app.chat.domain.interfaces.chat_event_publisher import ChatEventPublisher
from app.chat.domain.interfaces.conversation_repository import ConversationRepository


class RejectAction:
    """Passe une `ChatAction` proposee en statut `rejected` et publie le resultat.

    Un rejet ne delegue RIEN au deploiement : aucune ressource n'est touchee.
    Isolation par owner (404 si l'action est inconnue ou appartient a autrui).
    """

    def __init__(
        self,
        *,
        conversations: ConversationRepository,
        actions: ChatActionRepository,
        publisher: ChatEventPublisher,
    ) -> None:
        self._conversations = conversations
        self._actions = actions
        self._publisher = publisher

    async def execute(self, *, action_id: UUID, owner_id: UUID) -> None:
        """Rejette l'action de cet owner (404 si inconnue / non possedee / non proposed)."""
        action = await load_pending_owned_action(
            actions=self._actions,
            conversations=self._conversations,
            action_id=action_id,
            owner_id=owner_id,
        )
        action.status = ActionStatus.REJECTED
        await self._actions.update(action)
        await self._publisher.publish(
            action.conversation_id,
            "action_result",
            {"action_id": str(action.id), "kind": action.kind.value, "success": False},
        )
