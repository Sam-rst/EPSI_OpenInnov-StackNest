"""Tests unitaires du use case ConfirmAction (delegation au slice deploiement).

Verifie que la confirmation d'une action DELEGUE aux use cases de deploiement
existants (via le port `DeploymentActions`), met a jour le statut de la
`ChatAction` (executed / failed), publie `action_result`, isole par proprietaire,
et refuse de re-executer une action deja confirmee/rejetee (idempotence).
"""

from typing import Any
from uuid import UUID, uuid4

import pytest

from app.chat.application.__tests__.fakes import (
    FakeChatActionRepository,
    FakeChatEventPublisher,
    FakeConversationRepository,
    FakeDeploymentActions,
)
from app.chat.application.confirm_action import ConfirmAction
from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.domain.exceptions.chat_action_not_found import ChatActionNotFoundException


def _conversation(owner_id: UUID) -> Conversation:
    return Conversation(id=uuid4(), owner_id=owner_id, title="Fil")


def _action(
    conversation_id: UUID,
    kind: ActionKind = ActionKind.DEPLOY,
    args: dict[str, Any] | None = None,
    status: ActionStatus = ActionStatus.PROPOSED,
) -> ChatAction:
    return ChatAction(
        id=uuid4(),
        conversation_id=conversation_id,
        message_id=uuid4(),
        kind=kind,
        status=status,
        args=args or {},
    )


def _build(
    conversations: FakeConversationRepository,
    actions: FakeChatActionRepository,
    publisher: FakeChatEventPublisher,
    delegate: FakeDeploymentActions,
) -> ConfirmAction:
    return ConfirmAction(
        conversations=conversations, actions=actions, publisher=publisher, delegate=delegate
    )


class TestDeployDelegation:
    async def test_confirme_un_deploy_delegue_a_create_deployment(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        template_id = uuid4()
        action = _action(
            conversation.id,
            kind=ActionKind.DEPLOY,
            args={"template_id": str(template_id), "version": "16", "name": "db", "params": {}},
        )
        actions = FakeChatActionRepository([action])
        publisher = FakeChatEventPublisher()
        delegate = FakeDeploymentActions(deployment_id="dep-123")
        confirm = _build(FakeConversationRepository([conversation]), actions, publisher, delegate)

        await confirm.execute(action_id=action.id, owner_id=owner)

        assert [name for name, _ in delegate.calls] == ["deploy"]
        assert delegate.calls[0][1]["template_id"] == template_id
        assert actions.updated[-1].status is ActionStatus.EXECUTED
        assert actions.updated[-1].deployment_id == "dep-123"
        assert "action_result" in publisher.names()


class TestLifecycleDelegation:
    async def test_confirme_un_stop_delegue_a_stop_deployment(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        deployment_id = uuid4()
        action = _action(
            conversation.id, kind=ActionKind.STOP, args={"deployment_id": str(deployment_id)}
        )
        delegate = FakeDeploymentActions()
        actions = FakeChatActionRepository([action])
        confirm = _build(
            FakeConversationRepository([conversation]), actions, FakeChatEventPublisher(), delegate
        )

        await confirm.execute(action_id=action.id, owner_id=owner)

        assert delegate.calls[0][0] == "stop"
        assert delegate.calls[0][1]["deployment_id"] == deployment_id
        assert actions.updated[-1].status is ActionStatus.EXECUTED

    async def test_confirme_un_regenerate_delegue(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        action = _action(
            conversation.id,
            kind=ActionKind.REGENERATE,
            args={"deployment_id": str(uuid4())},
        )
        delegate = FakeDeploymentActions()
        confirm = _build(
            FakeConversationRepository([conversation]),
            FakeChatActionRepository([action]),
            FakeChatEventPublisher(),
            delegate,
        )

        await confirm.execute(action_id=action.id, owner_id=owner)

        assert delegate.calls[0][0] == "regenerate"


class TestGuards:
    async def test_action_inconnue_leve_404(self) -> None:
        confirm = _build(
            FakeConversationRepository([]),
            FakeChatActionRepository([]),
            FakeChatEventPublisher(),
            FakeDeploymentActions(),
        )

        with pytest.raises(ChatActionNotFoundException):
            await confirm.execute(action_id=uuid4(), owner_id=uuid4())

    async def test_action_d_autrui_leve_404(self) -> None:
        conversation = _conversation(uuid4())
        action = _action(conversation.id, args={"deployment_id": str(uuid4())})
        confirm = _build(
            FakeConversationRepository([conversation]),
            FakeChatActionRepository([action]),
            FakeChatEventPublisher(),
            FakeDeploymentActions(),
        )

        with pytest.raises(ChatActionNotFoundException):
            await confirm.execute(action_id=action.id, owner_id=uuid4())

    async def test_action_deja_executee_n_est_pas_re_executee(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        action = _action(
            conversation.id,
            kind=ActionKind.STOP,
            args={"deployment_id": str(uuid4())},
            status=ActionStatus.EXECUTED,
        )
        delegate = FakeDeploymentActions()
        confirm = _build(
            FakeConversationRepository([conversation]),
            FakeChatActionRepository([action]),
            FakeChatEventPublisher(),
            delegate,
        )

        with pytest.raises(ChatActionNotFoundException):
            await confirm.execute(action_id=action.id, owner_id=owner)
        assert delegate.calls == []

    async def test_echec_de_delegation_marque_failed_et_publie(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        action = _action(
            conversation.id, kind=ActionKind.STOP, args={"deployment_id": str(uuid4())}
        )
        actions = FakeChatActionRepository([action])
        publisher = FakeChatEventPublisher()
        delegate = _FailingDelegate()
        confirm = _build(FakeConversationRepository([conversation]), actions, publisher, delegate)

        with pytest.raises(RuntimeError):
            await confirm.execute(action_id=action.id, owner_id=owner)

        assert actions.updated[-1].status is ActionStatus.FAILED
        assert "action_result" in publisher.names()


class _FailingDelegate(FakeDeploymentActions):
    async def stop(self, *, owner_id: UUID, deployment_id: UUID) -> str:
        raise RuntimeError("delegation cassee")
