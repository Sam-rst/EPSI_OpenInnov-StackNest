"""Tests unitaires du ConversationMapper (entite <-> modele ORM)."""

from uuid import uuid4

from app.chat.domain.entities.conversation import Conversation
from app.chat.infrastructure.mappers.conversation_mapper import ConversationMapper
from app.chat.infrastructure.models.conversation_model import ConversationModel


class TestConversationMapper:
    def test_to_model_reporte_les_champs(self) -> None:
        entity = Conversation(id=uuid4(), owner_id=uuid4(), title="Mes tests")

        model = ConversationMapper.to_model(entity)

        assert model.id == entity.id
        assert model.owner_id == entity.owner_id
        assert model.title == "Mes tests"

    def test_to_entity_reporte_les_champs(self) -> None:
        model = ConversationModel(id=uuid4(), owner_id=uuid4(), title="Prod")

        entity = ConversationMapper.to_entity(model)

        assert entity.id == model.id
        assert entity.owner_id == model.owner_id
        assert entity.title == "Prod"

    def test_round_trip_preserve_l_identite(self) -> None:
        entity = Conversation(id=uuid4(), owner_id=uuid4(), title="Roundtrip")

        result = ConversationMapper.to_entity(ConversationMapper.to_model(entity))

        assert result == entity
