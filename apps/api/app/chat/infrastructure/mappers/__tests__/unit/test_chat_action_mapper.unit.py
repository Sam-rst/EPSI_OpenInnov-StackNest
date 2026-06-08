"""Tests unitaires du ChatActionMapper (entite <-> modele ORM)."""

from uuid import uuid4

from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.infrastructure.mappers.chat_action_mapper import ChatActionMapper
from app.chat.infrastructure.models.chat_action_model import ChatActionModel


def _action(**overrides: object) -> ChatAction:
    params: dict[str, object] = {
        "id": uuid4(),
        "conversation_id": uuid4(),
        "message_id": uuid4(),
        "kind": ActionKind.DEPLOY,
        "args": {"template_id": "abc"},
        "status": ActionStatus.PROPOSED,
        "deployment_id": None,
    }
    params.update(overrides)
    return ChatAction(**params)  # type: ignore[arg-type]


class TestChatActionMapper:
    def test_to_model_reporte_les_champs(self) -> None:
        entity = _action()

        model = ChatActionMapper.to_model(entity)

        assert model.id == entity.id
        assert model.conversation_id == entity.conversation_id
        assert model.message_id == entity.message_id
        assert model.kind is ActionKind.DEPLOY
        assert model.args == {"template_id": "abc"}
        assert model.status is ActionStatus.PROPOSED
        assert model.deployment_id is None

    def test_to_model_convertit_le_deployment_id_en_uuid(self) -> None:
        deployment_uuid = uuid4()
        entity = _action(
            status=ActionStatus.EXECUTED,
            deployment_id=str(deployment_uuid),
        )

        model = ChatActionMapper.to_model(entity)

        assert model.deployment_id == deployment_uuid

    def test_to_entity_convertit_le_deployment_id_en_chaine(self) -> None:
        deployment_uuid = uuid4()
        model = ChatActionModel(
            id=uuid4(),
            conversation_id=uuid4(),
            message_id=uuid4(),
            kind=ActionKind.STOP,
            args={},
            status=ActionStatus.EXECUTED,
            deployment_id=deployment_uuid,
        )

        entity = ChatActionMapper.to_entity(model)

        assert entity.deployment_id == str(deployment_uuid)

    def test_round_trip_avec_deployment_id_preserve_l_identite(self) -> None:
        entity = _action(
            status=ActionStatus.EXECUTED,
            deployment_id=str(uuid4()),
        )

        result = ChatActionMapper.to_entity(ChatActionMapper.to_model(entity))

        assert result == entity
