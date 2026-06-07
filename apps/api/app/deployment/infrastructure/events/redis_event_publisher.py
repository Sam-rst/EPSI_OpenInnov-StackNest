"""Adaptateur Redis pub/sub de l'interface EventPublisher."""

from uuid import UUID

from redis.asyncio import Redis

from app.deployment.domain.interfaces.event_publisher import EventPublisher
from app.deployment.domain.value_objects.deployment_event import DeploymentEvent
from app.deployment.infrastructure.events.deployment_channel import deployment_channel
from app.deployment.infrastructure.events.deployment_event_serializer import (
    serialize_deployment_event,
)


class RedisEventPublisher(EventPublisher):
    """Publie les events de deploiement sur le canal Redis `deployment:{id}`.

    Diffuse via `PUBLISH` le JSON de l'event (cf. design section 7). Le client
    Redis asynchrone partage est injecte ; son cycle de vie est gere par
    l'appelant (fabrique `get_redis_client`).
    """

    def __init__(self, client: Redis) -> None:
        self._client = client

    async def publish(self, deployment_id: UUID, event: DeploymentEvent) -> None:
        channel = deployment_channel(deployment_id)
        await self._client.publish(channel, serialize_deployment_event(event))
