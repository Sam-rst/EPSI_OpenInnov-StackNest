"""Adaptateur Redis pub/sub de l'interface StackEventSubscriber."""

from collections.abc import AsyncIterator
from uuid import UUID

from redis.asyncio import Redis

from app.stack.domain.interfaces.stack_event_subscriber import StackEventSubscriber
from app.stack.domain.value_objects.stack_event import StackEvent
from app.stack.infrastructure.events.stack_channel import stack_channel
from app.stack.infrastructure.events.stack_event_serializer import deserialize_stack_event

# Type de frame Redis porteur d'un event publie (les frames `subscribe`/
# `unsubscribe` de confirmation sont ignorees).
_MESSAGE_FRAME_TYPE = "message"


class RedisStackEventSubscriber(StackEventSubscriber):
    """S'abonne au canal Redis `stack:{id}` et renvoie un flux d'events.

    L'endpoint SSE consomme l'`AsyncIterator` : chaque message recu est
    deserialise en `StackEvent`. Le pub/sub Redis est ouvert a l'entree de
    l'iterateur et ferme proprement (`unsubscribe` + `aclose`) a sa sortie, quel
    que soit le motif (fin de boucle, annulation de la tache SSE, exception).
    """

    def __init__(self, client: Redis) -> None:
        self._client = client

    async def subscribe(self, stack_id: UUID) -> AsyncIterator[StackEvent]:
        channel = stack_channel(stack_id)
        pubsub = self._client.pubsub()
        await pubsub.subscribe(channel)
        try:
            async for message in pubsub.listen():
                if message["type"] != _MESSAGE_FRAME_TYPE:
                    continue
                yield deserialize_stack_event(message["data"])
        finally:
            await pubsub.unsubscribe(channel)
            # redis-py n'annote pas PubSub.aclose (lib tierce sans stubs ici).
            await pubsub.aclose()  # type: ignore[no-untyped-call]
