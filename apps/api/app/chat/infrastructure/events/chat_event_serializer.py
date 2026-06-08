"""(De)serialisation JSON d'un ChatEvent pour le canal Redis pub/sub.

L'event est diffuse en JSON sur le canal `chat:{id}`, puis consomme par le flux
SSE de l'API. Format `{event, payload}` : on conserve le nom de l'evenement et sa
charge utile telle quelle (agnostique du type d'event).
"""

import json
from typing import Any

from app.chat.domain.value_objects.chat_event import ChatEvent


def serialize_chat_event(event: ChatEvent) -> str:
    """Serialise l'event en chaine JSON (`{event, payload}`)."""
    return json.dumps({"event": event.event, "payload": event.payload})


def deserialize_chat_event(raw: str) -> ChatEvent:
    """Reconstruit un ChatEvent depuis sa chaine JSON.

    Leve `ValueError` (KeyError sous-jacente) si le nom d'evenement est absent.
    """
    data: dict[str, Any] = json.loads(raw)
    return ChatEvent(event=data["event"], payload=data.get("payload", {}))
