"""Tests unitaires de la (de)serialisation JSON d'un StackEvent."""

from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.value_objects.stack_event import StackEvent
from app.stack.infrastructure.events.stack_event_serializer import (
    deserialize_stack_event,
    serialize_stack_event,
)


class TestStackEventSerializer:
    def test_roundtrip_event_niveau_stack(self) -> None:
        event = StackEvent(stack_status=StackStatus.PROVISIONING)

        restored = deserialize_stack_event(serialize_stack_event(event))

        assert restored == event

    def test_roundtrip_event_niveau_service(self) -> None:
        event = StackEvent(
            stack_status=StackStatus.PROVISIONING,
            alias="db",
            service_status=ServiceStatus.RUNNING,
            access_url="localhost:32768",
        )

        restored = deserialize_stack_event(serialize_stack_event(event))

        assert restored == event

    def test_le_json_ne_contient_aucune_cle_secret(self) -> None:
        event = StackEvent(stack_status=StackStatus.RUNNING, alias="db")

        assert "secret" not in serialize_stack_event(event)
