"""(De)serialisation JSON d'un StackEvent pour le canal Redis pub/sub.

L'event est diffuse en JSON sur le canal `stack:{id}` (cf. spec SSE), puis
consomme par le flux SSE de l'API. Securite : un `StackEvent` ne porte JAMAIS de
secret (les secrets restent worker-side), donc rien de sensible ne transite ici.
"""

import json
from typing import Any

from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.value_objects.stack_event import StackEvent


def serialize_stack_event(event: StackEvent) -> str:
    """Serialise l'event en chaine JSON (statut stack + champs optionnels)."""
    payload = {
        "stack_status": event.stack_status.value,
        "alias": event.alias,
        "service_status": event.service_status.value if event.service_status else None,
        "message": event.message,
        "access_url": event.access_url,
    }
    return json.dumps(payload)


def deserialize_stack_event(raw: str) -> StackEvent:
    """Reconstruit un StackEvent depuis sa chaine JSON.

    Leve `ValueError` si le statut de stack est absent ou inconnu.
    """
    payload: dict[str, Any] = json.loads(raw)
    service_status_value = payload.get("service_status")
    return StackEvent(
        stack_status=StackStatus(payload["stack_status"]),
        alias=payload.get("alias"),
        service_status=ServiceStatus(service_status_value) if service_status_value else None,
        message=payload.get("message"),
        access_url=payload.get("access_url"),
    )
