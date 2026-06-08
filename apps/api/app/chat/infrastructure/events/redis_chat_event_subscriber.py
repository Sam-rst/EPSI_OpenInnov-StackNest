"""Adaptateur Redis pub/sub du port ChatEventSubscriber.

S'abonne au canal `chat:{id}` et renvoie un flux d'events deserialises consomme
par l'endpoint SSE. Le pub/sub est ouvert a l'entree de l'iterateur et ferme
proprement (`unsubscribe` + `aclose`) a sa sortie, quel que soit le motif (fin de
boucle, annulation de la tache SSE, exception). Calque sur le subscriber du
deploiement.
"""

from collections.abc import AsyncIterator
from uuid import UUID

from redis.asyncio import Redis

from app.chat.domain.interfaces.chat_event_subscriber import ChatEventSubscriber
from app.chat.domain.value_objects.chat_event import ChatEvent
from app.chat.infrastructure.events.chat_channel import chat_channel
from app.chat.infrastructure.events.chat_event_serializer import deserialize_chat_event

# Type de frame Redis porteur d'un event publie (les frames de confirmation
# `subscribe`/`unsubscribe` sont ignorees).
_MESSAGE_FRAME_TYPE = "message"


class RedisChatEventSubscriber(ChatEventSubscriber):
    """S'abonne au canal Redis `chat:{id}` et renvoie un flux d'events."""

    def __init__(self, client: Redis) -> None:
        self._client = client

    async def subscribe(self, conversation_id: UUID) -> AsyncIterator[ChatEvent]:
        channel = chat_channel(conversation_id)
        pubsub = self._client.pubsub()
        await pubsub.subscribe(channel)
        try:
            async for message in pubsub.listen():
                if message["type"] != _MESSAGE_FRAME_TYPE:
                    continue
                yield deserialize_chat_event(message["data"])
        finally:
            await pubsub.unsubscribe(channel)
            # redis-py n'annote pas PubSub.aclose (lib tierce sans stubs ici).
            await pubsub.aclose()  # type: ignore[no-untyped-call]
