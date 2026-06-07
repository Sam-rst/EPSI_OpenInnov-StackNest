"""Tests d'integration pub/sub des events de deploiement (testcontainers Redis).

Verifie le round-trip publish -> subscribe sur un Redis reel : un event publie
par `RedisEventPublisher` est recu, deserialise, par `RedisEventSubscriber` sur
le canal `deployment:{id}`.
"""

import asyncio
import time
from collections.abc import AsyncIterator, Iterator
from uuid import UUID, uuid4

import pytest
from redis.asyncio import Redis
from testcontainers.redis import RedisContainer

from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.value_objects.deployment_event import DeploymentEvent
from app.deployment.infrastructure.events.redis_event_publisher import RedisEventPublisher
from app.deployment.infrastructure.events.redis_event_subscriber import RedisEventSubscriber


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


async def _first_event(subscriber: RedisEventSubscriber, deployment_id: UUID) -> DeploymentEvent:
    stream = subscriber.subscribe(deployment_id)
    return await asyncio.wait_for(stream.__anext__(), timeout=5)


class TestRedisEventsRoundTrip:
    async def test_publie_un_event_recu_par_l_abonne(self, client: Redis) -> None:
        deployment_id = uuid4()
        publisher = RedisEventPublisher(client)
        subscriber = RedisEventSubscriber(client)
        event = DeploymentEvent(
            status=DeploymentStatus.RUNNING,
            message="ok",
            access_url="host:1234",
            secret="pwd",
        )

        consumer = asyncio.create_task(_first_event(subscriber, deployment_id))
        await asyncio.sleep(0.3)  # laisse l'abonnement s'etablir avant de publier
        await publisher.publish(deployment_id, event)

        recu = await consumer
        assert recu == event

    async def test_isole_les_canaux_par_deploiement(self, client: Redis) -> None:
        cible = uuid4()
        autre = uuid4()
        publisher = RedisEventPublisher(client)
        subscriber = RedisEventSubscriber(client)
        attendu = DeploymentEvent(status=DeploymentStatus.STOPPED, message="cible")

        consumer = asyncio.create_task(_first_event(subscriber, cible))
        await asyncio.sleep(0.3)
        await publisher.publish(autre, DeploymentEvent(status=DeploymentStatus.FAILED))
        await publisher.publish(cible, attendu)

        recu = await consumer
        assert recu == attendu

    async def test_diffuse_plusieurs_events_dans_l_ordre(self, client: Redis) -> None:
        deployment_id = uuid4()
        publisher = RedisEventPublisher(client)
        subscriber = RedisEventSubscriber(client)
        sequence = [
            DeploymentEvent(status=DeploymentStatus.PROVISIONING),
            DeploymentEvent(status=DeploymentStatus.RUNNING, access_url="h:1"),
        ]

        async def consume_two() -> list[DeploymentEvent]:
            stream = subscriber.subscribe(deployment_id)
            return [
                await asyncio.wait_for(stream.__anext__(), timeout=5),
                await asyncio.wait_for(stream.__anext__(), timeout=5),
            ]

        consumer = asyncio.create_task(consume_two())
        await asyncio.sleep(0.3)
        for event in sequence:
            await publisher.publish(deployment_id, event)

        assert await consumer == sequence
