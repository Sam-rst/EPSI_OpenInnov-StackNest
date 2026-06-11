"""Use case GetConversation : detail d'un fil possede (avec ses messages)."""

from uuid import UUID

from app.chat.application.conversation_access import load_owned_conversation
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.interfaces.conversation_repository import ConversationRepository
from app.chat.domain.interfaces.proposed_action_reader import ProposedActionReader
from app.chat.domain.value_objects.proposed_action import ProposedAction

# Couple (message affichable, proposition rejouable) — None si aucune.
MessageWithProposal = tuple[Message, ProposedAction | None]


class GetConversation:
    """Renvoie un fil de l'utilisateur (404 si inconnu ou non possede)."""

    def __init__(
        self,
        repository: ConversationRepository,
        *,
        proposed_reader: ProposedActionReader | None = None,
    ) -> None:
        self._repository = repository
        self._proposed_reader = proposed_reader

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
        return await self._displayable_messages(conversation_id)

    async def list_messages_with_proposals(
        self, *, conversation_id: UUID, owner_id: UUID
    ) -> list[MessageWithProposal]:
        """Messages affichables, chacun apparie a sa proposition encore `proposed` (ou None).

        Permet au front de rejouer la carte d'action au rechargement d'un fil : le
        message assistant porteur d'une proposition `proposed` ressort avec son
        recap public rattache. Sans `ProposedActionReader`, aucune proposition n'est
        rattachee (retro-compat).
        """
        await load_owned_conversation(self._repository, conversation_id, owner_id)
        messages = await self._displayable_messages(conversation_id)
        proposals = await self._proposals_by_message(conversation_id)
        return [(message, proposals.get(message.id)) for message in messages]

    async def _displayable_messages(self, conversation_id: UUID) -> list[Message]:
        messages = await self._repository.list_messages(conversation_id)
        return [message for message in messages if message.role is not MessageRole.TOOL]

    async def _proposals_by_message(self, conversation_id: UUID) -> dict[UUID, ProposedAction]:
        if self._proposed_reader is None:
            return {}
        proposals = await self._proposed_reader.list_proposed(conversation_id)
        return {proposal.message_id: proposal for proposal in proposals}
