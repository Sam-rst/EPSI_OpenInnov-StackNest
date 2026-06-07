"""Tests d'integration de ArqJobQueue contre un Redis reel (testcontainers).

Verifie qu'un `DeploymentJob` enfile via l'adaptateur arrive bien dans la file
arq dediee, avec la fonction worker et les arguments serialises attendus.
"""

import time
from collections.abc import AsyncIterator, Iterator
from uuid import uuid4

import pytest
from arq.connections import ArqRedis, create_pool
from testcontainers.redis import RedisContainer

from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.value_objects.deployment_job import DeploymentJob
from app.deployment.infrastructure.queue.arq_job_queue import ArqJobQueue
from app.deployment.infrastructure.queue.arq_settings import (
    DEPLOYMENT_JOB_FUNCTION,
    DEPLOYMENT_QUEUE_NAME,
    redis_settings_from_url,
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
async def pool(redis_url: str) -> AsyncIterator[ArqRedis]:
    arq_pool = await create_pool(redis_settings_from_url(redis_url))
    try:
        yield arq_pool
    finally:
        await arq_pool.aclose()


class TestArqJobQueueEnqueue:
    async def test_enfile_le_job_dans_la_file_dediee(self, pool: ArqRedis) -> None:
        deployment_id = uuid4()
        queue = ArqJobQueue(pool)

        await queue.enqueue(DeploymentJob(kind=JobKind.PROVISION, deployment_id=deployment_id))

        jobs = await pool.queued_jobs(queue_name=DEPLOYMENT_QUEUE_NAME)
        enqueued = [j for j in jobs if j.kwargs.get("deployment_id") == str(deployment_id)]
        assert len(enqueued) == 1
        job_def = enqueued[0]
        assert job_def.function == DEPLOYMENT_JOB_FUNCTION
        assert job_def.kwargs == {"kind": "provision", "deployment_id": str(deployment_id)}

    async def test_n_enfile_rien_dans_la_file_par_defaut(self, pool: ArqRedis) -> None:
        deployment_id = uuid4()
        queue = ArqJobQueue(pool)

        await queue.enqueue(DeploymentJob(kind=JobKind.STOP, deployment_id=deployment_id))

        default_jobs = await pool.queued_jobs()
        assert all(j.kwargs.get("deployment_id") != str(deployment_id) for j in default_jobs)
