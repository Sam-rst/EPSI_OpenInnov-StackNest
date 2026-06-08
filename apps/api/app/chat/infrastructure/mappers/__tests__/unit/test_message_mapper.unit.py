"""Tests unitaires du MessageMapper (entite <-> modele ORM)."""

from uuid import uuid4

from app.chat.domain.entities.message import Message
from app.chat.domain.enums.message_role import MessageRole
from app.chat.infrastructure.mappers.message_mapper import MessageMapper
from app.chat.infrastructure.models.message_model import MessageModel


class TestMessageMapper:
    def test_to_model_reporte_les_champs(self) -> None:
        entity = Message(
            id=uuid4(),
            conversation_id=uuid4(),
            role=MessageRole.USER,
            content="Deploie un postgres",
        )

        model = MessageMapper.to_model(entity)

        assert model.id == entity.id
        assert model.conversation_id == entity.conversation_id
        assert model.role is MessageRole.USER
        assert model.content == "Deploie un postgres"

    def test_to_entity_reporte_les_champs(self) -> None:
        model = MessageModel(
            id=uuid4(),
            conversation_id=uuid4(),
            role=MessageRole.ASSISTANT,
            content="Voici.",
        )

        entity = MessageMapper.to_entity(model)

        assert entity.id == model.id
        assert entity.conversation_id == model.conversation_id
        assert entity.role is MessageRole.ASSISTANT
        assert entity.content == "Voici."

    def test_round_trip_preserve_l_identite(self) -> None:
        entity = Message(
            id=uuid4(),
            conversation_id=uuid4(),
            role=MessageRole.TOOL,
            content="resultat outil",
        )

        result = MessageMapper.to_entity(MessageMapper.to_model(entity))

        assert result == entity
