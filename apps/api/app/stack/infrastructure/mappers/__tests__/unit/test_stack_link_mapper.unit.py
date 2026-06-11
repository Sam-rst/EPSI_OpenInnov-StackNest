"""Tests unitaires du StackLinkMapper (entite <-> modele ORM)."""

from uuid import uuid4

from app.stack.domain.entities.stack_link import StackLink
from app.stack.infrastructure.mappers.stack_link_mapper import StackLinkMapper


def _link() -> StackLink:
    return StackLink(
        id=uuid4(),
        stack_id=uuid4(),
        from_service_id=uuid4(),
        to_service_id=uuid4(),
        var_mappings={"DB_HOST": "{to.alias}", "DB_PORT": "{to.port}"},
    )


class TestStackLinkMapper:
    def test_to_model_reporte_les_champs(self) -> None:
        entity = _link()

        model = StackLinkMapper.to_model(entity)

        assert model.id == entity.id
        assert model.stack_id == entity.stack_id
        assert model.from_service_id == entity.from_service_id
        assert model.to_service_id == entity.to_service_id
        assert model.var_mappings == {"DB_HOST": "{to.alias}", "DB_PORT": "{to.port}"}

    def test_to_entity_copie_les_mappings(self) -> None:
        model = StackLinkMapper.to_model(_link())

        entity = StackLinkMapper.to_entity(model)

        # Copie defensive : muter l'entite ne doit pas alterer le modele source.
        entity.var_mappings["NEW"] = "x"
        assert "NEW" not in model.var_mappings

    def test_round_trip_preserve_l_identite(self) -> None:
        entity = _link()

        result = StackLinkMapper.to_entity(StackLinkMapper.to_model(entity))

        assert result == entity
