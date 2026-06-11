"""Tests d'integration pub/sub des events de stack (testcontainers Redis).

Verifie le round-trip publish -> subscribe sur un Redis reel : un event publie
par `RedisStackEventPublisher` est recu, deserialise, par
`RedisStackEventSubscriber` sur le canal `stack:{id}`.
"""

import asyncio
import time
from collections.abc import AsyncIterator, Iterator
from uuid import UUID, uuid4

import pytest
from redis.asyncio import Redis
from testcontainers.redis import RedisContainer

from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.value_objects.stack_event import StackEvent
from app.stack.infrastructure.events.redis_stack_event_publisher import (
    RedisStackEventPublisher,
)
from app.stack.infrastructure.events.redis_stack_event_subscriber import (
    RedisStackEventSubscriber,
)


@pytest.fixture(scope="module")
def redis_url() -> Iterator[str]:
    container = RedisContainer("redis:7-alpine")
    container.start()
    try:
        host = container.get_container_host_ip()
        port = container.get_exposed_port(6379)
        time.sleep(0.5)
        yield f"redis://{host}:{port}/0"
    finally:
        container.stop()


@pytest.fixture
async def client(redis_url: str) -> AsyncIterator[Redis]:
    redis: Redis = Redis.from_url(redis_url, decode_responses=True)
    try:
        yield redis
    finally:
        await redis.aclose()


async def _first_event(subscriber: RedisStackEventSubscriber, stack_id: UUID) -> StackEvent:
    stream = subscriber.subscribe(stack_id)
    return await asyncio.wait_for(stream.__anext__(), timeout=5)


class TestRedisStackEventsRoundTrip:
    async def test_publie_un_event_de_service_recu_par_l_abonne(self, client: Redis) -> None:
        stack_id = uuid4()
        publisher = RedisStackEventPublisher(client)
        subscriber = RedisStackEventSubscriber(client)
        event = StackEvent(
            stack_status=StackStatus.PROVISIONING,
            alias="db",
            service_status=ServiceStatus.RUNNING,
            access_url="localhost:32768",
        )

        consumer = asyncio.create_task(_first_event(subscriber, stack_id))
        await asyncio.sleep(0.3)  # laisse l'abonnement s'etablir avant de publier
        await publisher.publish(stack_id, event)

        recu = await consumer
        assert recu == event

    async def test_isole_les_canaux_par_stack(self, client: Redis) -> None:
        cible = uuid4()
        autre = uuid4()
        publisher = RedisStackEventPublisher(client)
        subscriber = RedisStackEventSubscriber(client)
        attendu = StackEvent(stack_status=StackStatus.RUNNING)

        consumer = asyncio.create_task(_first_event(subscriber, cible))
        await asyncio.sleep(0.3)
        await publisher.publish(autre, StackEvent(stack_status=StackStatus.FAILED))
        await publisher.publish(cible, attendu)

        recu = await consumer
        assert recu == attendu
