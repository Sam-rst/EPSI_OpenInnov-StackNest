"""Adaptateur Redis pub/sub de l'interface EventSubscriber."""

from collections.abc import AsyncIterator
from uuid import UUID

from redis.asyncio import Redis

from app.deployment.domain.interfaces.event_subscriber import EventSubscriber
from app.deployment.domain.value_objects.deployment_event import DeploymentEvent
from app.deployment.infrastructure.events.deployment_channel import deployment_channel
from app.deployment.infrastructure.events.deployment_event_serializer import (
    deserialize_deployment_event,
)

# Type de frame Redis porteur d'un event publie (les frames `subscribe`/
# `unsubscribe` de confirmation sont ignorees).
_MESSAGE_FRAME_TYPE = "message"


class RedisEventSubscriber(EventSubscriber):
    """S'abonne au canal Redis `deployment:{id}` et renvoie un flux d'events.

    L'endpoint SSE consomme l'`AsyncIterator` : chaque message recu est
    deserialise en `DeploymentEvent`. Le pub/sub Redis est ouvert a l'entree de
    l'iterateur et ferme proprement (`unsubscribe` + `aclose`) a sa sortie, quel
    que soit le motif (fin de boucle, annulation de la tache SSE, exception).
    """

    def __init__(self, client: Redis) -> None:
        self._client = client

    async def subscribe(self, deployment_id: UUID) -> AsyncIterator[DeploymentEvent]:
        channel = deployment_channel(deployment_id)
        pubsub = self._client.pubsub()
        await pubsub.subscribe(channel)
        try:
            async for message in pubsub.listen():
                if message["type"] != _MESSAGE_FRAME_TYPE:
                    continue
                yield deserialize_deployment_event(message["data"])
        finally:
            await pubsub.unsubscribe(channel)
            # redis-py n'annote pas PubSub.aclose (lib tierce sans stubs ici).
            await pubsub.aclose()  # type: ignore[no-untyped-call]
