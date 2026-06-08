"""Adaptateur Redis pub/sub du port ChatEventPublisher.

Publie via `PUBLISH` le JSON de l'event sur le canal `chat:{conversation_id}`
(meme mecanisme que le flux SSE du deploiement). Le client Redis asynchrone
partage est injecte ; son cycle de vie est gere par l'appelant (fabrique
`get_redis_client`).
"""

from typing import Any
from uuid import UUID

from redis.asyncio import Redis

from app.chat.domain.interfaces.chat_event_publisher import ChatEventPublisher
from app.chat.domain.value_objects.chat_event import ChatEvent
from app.chat.infrastructure.events.chat_channel import chat_channel
from app.chat.infrastructure.events.chat_event_serializer import serialize_chat_event


class RedisChatEventPublisher(ChatEventPublisher):
    """Publie les events de chat sur le canal Redis `chat:{id}`."""

    def __init__(self, client: Redis) -> None:
        self._client = client

    async def publish(self, conversation_id: UUID, event: str, payload: dict[str, Any]) -> None:
        channel = chat_channel(conversation_id)
        await self._client.publish(channel, serialize_chat_event(ChatEvent(event, payload)))
