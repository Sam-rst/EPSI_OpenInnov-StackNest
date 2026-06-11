"""Tests unitaires du value object StackEvent (event SSE 2 niveaux, sans secret)."""

from dataclasses import fields

from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.value_objects.stack_event import StackEvent


class TestStackEvent:
    def test_event_niveau_stack_sans_alias(self) -> None:
        event = StackEvent(stack_status=StackStatus.PROVISIONING)

        assert event.alias is None
        assert event.is_service_level() is False
        assert event.service_status is None

    def test_event_niveau_service_porte_alias_et_statut(self) -> None:
        event = StackEvent(
            stack_status=StackStatus.RUNNING,
            alias="db",
            service_status=ServiceStatus.RUNNING,
            access_url="localhost:32768",
        )

        assert event.is_service_level() is True
        assert event.alias == "db"
        assert event.service_status is ServiceStatus.RUNNING
        assert event.access_url == "localhost:32768"

    def test_aucun_champ_secret_dans_le_value_object(self) -> None:
        # Securite : un StackEvent ne doit jamais transporter de secret.
        names = {field.name for field in fields(StackEvent)}
        assert "secret" not in names
