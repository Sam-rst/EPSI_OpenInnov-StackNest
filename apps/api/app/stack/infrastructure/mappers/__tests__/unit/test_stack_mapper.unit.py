"""Tests unitaires du StackMapper (entite <-> modele ORM)."""

from uuid import uuid4

from app.stack.domain.entities.stack import Stack
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.infrastructure.mappers.stack_mapper import StackMapper
from app.stack.infrastructure.models.stack_model import StackModel


def _stack() -> Stack:
    return Stack(id=uuid4(), owner_id=uuid4(), name="ma-stack", status=StackStatus.PENDING)


class TestStackMapper:
    def test_to_model_reporte_les_champs(self) -> None:
        entity = _stack()

        model = StackMapper.to_model(entity)

        assert model.id == entity.id
        assert model.owner_id == entity.owner_id
        assert model.name == "ma-stack"
        assert model.status is StackStatus.PENDING

    def test_to_entity_reporte_les_champs(self) -> None:
        model = StackModel(
            id=uuid4(),
            owner_id=uuid4(),
            name="prod",
            status=StackStatus.RUNNING,
        )

        entity = StackMapper.to_entity(model)

        assert entity.id == model.id
        assert entity.owner_id == model.owner_id
        assert entity.name == "prod"
        assert entity.status is StackStatus.RUNNING

    def test_round_trip_preserve_l_identite(self) -> None:
        entity = _stack()

        result = StackMapper.to_entity(StackMapper.to_model(entity))

        assert result == entity
