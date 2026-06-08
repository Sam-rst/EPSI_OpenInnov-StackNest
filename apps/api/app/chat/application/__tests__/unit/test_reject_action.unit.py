"""Tests unitaires du use case RejectAction.

Rejeter une proposition la passe en statut `rejected` (etat terminal), publie
`action_result` (success=False), isole par owner, et ne delegue RIEN au
deploiement (un rejet n'execute aucune action).
"""

from uuid import UUID, uuid4

import pytest

from app.chat.application.__tests__.fakes import (
    FakeChatActionRepository,
    FakeChatEventPublisher,
    FakeConversationRepository,
)
from app.chat.application.reject_action import RejectAction
from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.domain.exceptions.chat_action_not_found import ChatActionNotFoundException


def _conversation(owner_id: UUID) -> Conversation:
    return Conversation(id=uuid4(), owner_id=owner_id, title="Fil")


def _action(conversation_id: UUID, status: ActionStatus = ActionStatus.PROPOSED) -> ChatAction:
    return ChatAction(
        id=uuid4(),
        conversation_id=conversation_id,
        message_id=uuid4(),
        kind=ActionKind.DEPLOY,
        status=status,
        args={"template_id": str(uuid4()), "version": "16", "name": "db", "params": {}},
    )


def _build(
    conversations: FakeConversationRepository,
    actions: FakeChatActionRepository,
    publisher: FakeChatEventPublisher,
) -> RejectAction:
    return RejectAction(conversations=conversations, actions=actions, publisher=publisher)


class TestReject:
    async def test_rejette_une_proposition_et_publie_le_resultat(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        action = _action(conversation.id)
        actions = FakeChatActionRepository([action])
        publisher = FakeChatEventPublisher()
        reject = _build(FakeConversationRepository([conversation]), actions, publisher)

        await reject.execute(action_id=action.id, owner_id=owner)

        assert actions.updated[-1].status is ActionStatus.REJECTED
        assert "action_result" in publisher.names()

    async def test_action_inconnue_leve_404(self) -> None:
        reject = _build(
            FakeConversationRepository([]), FakeChatActionRepository([]), FakeChatEventPublisher()
        )

        with pytest.raises(ChatActionNotFoundException):
            await reject.execute(action_id=uuid4(), owner_id=uuid4())

    async def test_action_d_autrui_leve_404(self) -> None:
        conversation = _conversation(uuid4())
        action = _action(conversation.id)
        reject = _build(
            FakeConversationRepository([conversation]),
            FakeChatActionRepository([action]),
            FakeChatEventPublisher(),
        )

        with pytest.raises(ChatActionNotFoundException):
            await reject.execute(action_id=action.id, owner_id=uuid4())
