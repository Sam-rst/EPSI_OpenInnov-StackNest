"""Adaptateur Redis pub/sub de l'interface StackEventPublisher."""

from uuid import UUID

from redis.asyncio import Redis

from app.stack.domain.interfaces.stack_event_publisher import StackEventPublisher
from app.stack.domain.value_objects.stack_event import StackEvent
from app.stack.infrastructure.events.stack_channel import stack_channel
from app.stack.infrastructure.events.stack_event_serializer import serialize_stack_event


class RedisStackEventPublisher(StackEventPublisher):
    """Publie les events de stack sur le canal Redis `stack:{id}`.

    Diffuse via `PUBLISH` le JSON de l'event (cf. spec SSE). Le client Redis
    asynchrone partage est injecte ; son cycle de vie est gere par l'appelant
    (worker `on_startup`).
    """

    def __init__(self, client: Redis) -> None:
        self._client = client

    async def publish(self, stack_id: UUID, event: StackEvent) -> None:
        channel = stack_channel(stack_id)
        await self._client.publish(channel, serialize_stack_event(event))
