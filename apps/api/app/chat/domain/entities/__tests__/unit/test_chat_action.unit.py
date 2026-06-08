"""Tests unitaires de l'entite ChatAction (trace auditable d'une action)."""

from uuid import uuid4

from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.action_status import ActionStatus


def _action(**overrides: object) -> ChatAction:
    params: dict[str, object] = {
        "id": uuid4(),
        "conversation_id": uuid4(),
        "message_id": uuid4(),
        "kind": ActionKind.DEPLOY,
        "args": {"template_id": "abc", "version": "16"},
        "status": ActionStatus.PROPOSED,
    }
    params.update(overrides)
    return ChatAction(**params)  # type: ignore[arg-type]


class TestChatActionValide:
    def test_construction_nominale(self) -> None:
        action = _action()

        assert action.kind is ActionKind.DEPLOY
        assert action.args == {"template_id": "abc", "version": "16"}
        assert action.status is ActionStatus.PROPOSED
        assert action.deployment_id is None
        assert action.created_at is None

    def test_args_par_defaut_vides(self) -> None:
        action = ChatAction(
            id=uuid4(),
            conversation_id=uuid4(),
            message_id=uuid4(),
            kind=ActionKind.STOP,
            status=ActionStatus.PROPOSED,
        )

        assert action.args == {}

    def test_deployment_id_renseigne_apres_execution(self) -> None:
        action = _action(status=ActionStatus.EXECUTED, deployment_id="dep-123")

        assert action.status is ActionStatus.EXECUTED
        assert action.deployment_id == "dep-123"
