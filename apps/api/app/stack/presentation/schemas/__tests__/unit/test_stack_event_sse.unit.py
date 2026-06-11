"""Tests unitaires du formatage SSE d'un StackEvent."""

import json

from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.value_objects.stack_event import StackEvent
from app.stack.presentation.schemas.stack_event_sse import format_stack_event_sse


class TestFormatStackEventSse:
    def test_event_de_stack_porte_le_statut_global_en_nom_d_evenement(self) -> None:
        frame = format_stack_event_sse(StackEvent(stack_status=StackStatus.PROVISIONING))

        assert frame.startswith("event: provisioning\n")
        assert frame.endswith("\n\n")
        payload = json.loads(frame.split("data: ", 1)[1].strip())
        assert payload["stack_status"] == "provisioning"
        assert payload["alias"] is None

    def test_event_de_service_porte_alias_statut_et_acces(self) -> None:
        frame = format_stack_event_sse(
            StackEvent(
                stack_status=StackStatus.PROVISIONING,
                alias="db",
                service_status=ServiceStatus.RUNNING,
                access_url="localhost:32768",
            )
        )

        payload = json.loads(frame.split("data: ", 1)[1].strip())
        assert payload["alias"] == "db"
        assert payload["service_status"] == "running"
        assert payload["access_url"] == "localhost:32768"

    def test_aucun_champ_secret_dans_la_trame(self) -> None:
        frame = format_stack_event_sse(StackEvent(stack_status=StackStatus.RUNNING))

        assert "secret" not in frame
