"""Tests unitaires du StackServiceMapper (entite <-> modele ORM)."""

from uuid import uuid4

from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.infrastructure.mappers.stack_service_mapper import StackServiceMapper


def _service() -> StackService:
    return StackService(
        id=uuid4(),
        stack_id=uuid4(),
        template_id=uuid4(),
        version="16",
        alias="db",
        service_status=ServiceStatus.RUNNING,
        order_index=2,
        params={"POSTGRES_DB": "app"},
        published_port=5432,
        container_ref="abc123",
    )


class TestStackServiceMapper:
    def test_to_model_reporte_les_champs(self) -> None:
        entity = _service()

        model = StackServiceMapper.to_model(entity)

        assert model.id == entity.id
        assert model.stack_id == entity.stack_id
        assert model.template_id == entity.template_id
        assert model.version == "16"
        assert model.alias == "db"
        assert model.service_status is ServiceStatus.RUNNING
        assert model.order_index == 2
        assert model.params == {"POSTGRES_DB": "app"}
        assert model.published_port == 5432
        assert model.container_ref == "abc123"

    def test_to_entity_copie_les_params(self) -> None:
        model = StackServiceMapper.to_model(_service())

        entity = StackServiceMapper.to_entity(model)

        assert entity.params == {"POSTGRES_DB": "app"}
        # Copie defensive : muter l'entite ne doit pas alterer le modele source.
        entity.params["NEW"] = "x"
        assert "NEW" not in model.params

    def test_round_trip_preserve_l_identite(self) -> None:
        entity = _service()

        result = StackServiceMapper.to_entity(StackServiceMapper.to_model(entity))

        assert result == entity
