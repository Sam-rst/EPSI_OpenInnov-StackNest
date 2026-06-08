"""Tests unitaires du canal, de la (de)serialisation et du formatage SSE chat."""

from uuid import uuid4

from app.chat.domain.value_objects.chat_event import ChatEvent
from app.chat.infrastructure.events.chat_channel import chat_channel
from app.chat.infrastructure.events.chat_event_serializer import (
    deserialize_chat_event,
    serialize_chat_event,
)
from app.chat.presentation.schemas.chat_event_sse import format_chat_event_sse


class TestChannel:
    def test_canal_prefixe_la_conversation(self) -> None:
        conversation_id = uuid4()

        assert chat_channel(conversation_id) == f"chat:{conversation_id}"


class TestSerializer:
    def test_aller_retour_preserve_event_et_payload(self) -> None:
        event = ChatEvent(event="token", payload={"delta": "Bon"})

        restored = deserialize_chat_event(serialize_chat_event(event))

        assert restored.event == "token"
        assert restored.payload == {"delta": "Bon"}


class TestSseFormat:
    def test_formate_une_trame_event_data(self) -> None:
        event = ChatEvent(event="message", payload={"content": "Salut"})

        frame = format_chat_event_sse(event)

        assert frame.startswith("event: message\n")
        assert '"content": "Salut"' in frame
        assert frame.endswith("\n\n")
