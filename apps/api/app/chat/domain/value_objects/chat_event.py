"""Value object ChatEvent : evenement diffuse sur le flux SSE d'une conversation."""

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ChatEvent:
    """Evenement nomme diffuse sur le canal d'une conversation (streaming SSE).

    Immutable : produit par `SendMessage` / `ConfirmAction` / `RejectAction` puis
    publie via `ChatEventPublisher`, transporte sur le canal Redis `chat:{id}` et
    re-emis au client en trame SSE. Reste agnostique de la forme exacte des
    payloads (token, message, action_proposed, action_result, error).

    - `event`   : nom de l'evenement (type SSE), non vide.
    - `payload` : charge utile serialisable JSON.
    """

    event: str
    payload: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.event.strip():
            raise ValueError("ChatEvent.event ne doit pas etre vide.")
