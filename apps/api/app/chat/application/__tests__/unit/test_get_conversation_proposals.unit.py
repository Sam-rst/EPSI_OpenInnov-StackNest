"""Tests unitaires : GetConversation rattache la proposition encore « proposed ».

Au rechargement d'un fil (`GET /chat/conversations/{id}`), un message assistant
qui porte une proposition d'action encore `proposed` doit ressortir avec cette
proposition rattachee (carte rejouable cote front). Les actions terminees
(executed / rejected / failed) ne sont PAS rejouees comme cartes confirmables.
"""

from uuid import UUID, uuid4

from app.chat.application.__tests__.fakes import (
    FakeConversationRepository,
    FakeProposedActionReader,
)
from app.chat.application.get_conversation import GetConversation
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.value_objects.proposed_action import ProposedAction


def _conversation(owner_id: UUID) -> Conversation:
    return Conversation(id=uuid4(), owner_id=owner_id, title="Fil")


class TestListMessagesWithProposals:
    async def test_rattache_la_proposition_proposed_au_message(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        repository = FakeConversationRepository([conversation])
        assistant = Message(
            id=uuid4(),
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content="Déployer PostgreSQL 16 sous le nom « db ».",
        )
        await repository.add_message(assistant)
        proposal = ProposedAction(
            action_id=uuid4(),
            message_id=assistant.id,
            kind=ActionKind.DEPLOY,
            recap={"template": "PostgreSQL", "version": "16", "name": "db"},
        )
        reader = FakeProposedActionReader([proposal])

        result = await GetConversation(
            repository, proposed_reader=reader
        ).list_messages_with_proposals(conversation_id=conversation.id, owner_id=owner)

        assert len(result) == 1
        message, attached = result[0]
        assert message.id == assistant.id
        assert attached is not None
        assert attached.action_id == proposal.action_id
        assert attached.kind is ActionKind.DEPLOY
        assert attached.recap == {"template": "PostgreSQL", "version": "16", "name": "db"}

    async def test_message_sans_proposition_n_a_pas_d_action(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        repository = FakeConversationRepository([conversation])
        assistant = Message(
            id=uuid4(),
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content="Quel nom veux-tu ?",
        )
        await repository.add_message(assistant)
        reader = FakeProposedActionReader([])

        result = await GetConversation(
            repository, proposed_reader=reader
        ).list_messages_with_proposals(conversation_id=conversation.id, owner_id=owner)

        assert result == [(assistant, None)]

    async def test_sans_reader_aucune_proposition_rattachee(self) -> None:
        # GetConversation reste utilisable sans reader (retro-compat) : les messages
        # ressortent simplement sans proposition.
        owner = uuid4()
        conversation = _conversation(owner)
        repository = FakeConversationRepository([conversation])
        assistant = Message(
            id=uuid4(),
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content="Bonjour",
        )
        await repository.add_message(assistant)

        result = await GetConversation(repository).list_messages_with_proposals(
            conversation_id=conversation.id, owner_id=owner
        )

        assert result == [(assistant, None)]

    async def test_masque_les_messages_outils(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        repository = FakeConversationRepository([conversation])
        for role, content in (
            (MessageRole.USER, "Deploie un postgres"),
            (MessageRole.TOOL, '[get_template] {"id": "..."}'),
            (MessageRole.ASSISTANT, "Quel nom ?"),
        ):
            await repository.add_message(
                Message(id=uuid4(), conversation_id=conversation.id, role=role, content=content)
            )

        result = await GetConversation(
            repository, proposed_reader=FakeProposedActionReader([])
        ).list_messages_with_proposals(conversation_id=conversation.id, owner_id=owner)

        assert [message.role for message, _ in result] == [MessageRole.USER, MessageRole.ASSISTANT]
