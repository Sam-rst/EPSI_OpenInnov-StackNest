"""Encodage d'un StackEvent au format Server-Sent Events (SSE).

Traduit l'event de domaine en trame texte `text/event-stream` consommee par
l'`EventSource` du navigateur. Le nom d'evenement SSE reprend le statut global
de la stack (le front peut s'abonner par type), la charge utile JSON porte le
niveau (stack vs service via `alias`), le statut de service et l'`access_url`.
Securite (cf. spec) : aucun secret ne transite — un `StackEvent` n'en porte pas.
"""

import json

from app.stack.domain.value_objects.stack_event import StackEvent


def format_stack_event_sse(event: StackEvent) -> str:
    """Serialise l'event en trame SSE (`event:` + `data:` + ligne vide finale)."""
    payload = {
        "stack_status": event.stack_status.value,
        "alias": event.alias,
        "service_status": event.service_status.value if event.service_status else None,
        "message": event.message,
        "access_url": event.access_url,
    }
    return f"event: {event.stack_status.value}\ndata: {json.dumps(payload)}\n\n"
