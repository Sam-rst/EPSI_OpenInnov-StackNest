"""Encodage d'un ChatEvent au format Server-Sent Events (SSE).

Traduit l'event de conversation en trame texte `text/event-stream` consommee par
l'`EventSource` / le lecteur SSE du navigateur. Le nom d'evenement SSE reprend le
nom de l'event (token / message / action_proposed / action_result / error) afin
que le front puisse s'abonner par type ; la charge utile JSON porte le payload.
"""

import json

from app.chat.domain.value_objects.chat_event import ChatEvent


def format_chat_event_sse(event: ChatEvent) -> str:
    """Serialise l'event en trame SSE (`event:` + `data:` + ligne vide finale)."""
    return f"event: {event.event}\ndata: {json.dumps(event.payload)}\n\n"
