"""Adaptateur arq de l'interface JobQueue (enfilage Redis des jobs worker)."""

from arq.connections import ArqRedis

from app.deployment.domain.interfaces.job_queue import JobQueue
from app.deployment.domain.value_objects.deployment_job import DeploymentJob
from app.deployment.infrastructure.queue.arq_settings import (
    DEPLOYMENT_JOB_FUNCTION,
    DEPLOYMENT_QUEUE_NAME,
)
from app.deployment.infrastructure.queue.deployment_job_serializer import (
    serialize_deployment_job,
)


class ArqJobQueue(JobQueue):
    """Implementation de JobQueue par la file `arq` sur Redis (cf. design 6).

    Enfile la fonction worker `process_deployment_job` dans la file dediee
    `stacknest:deployment` avec le job serialise en arguments nommes. Le pool
    `ArqRedis` (cree via `create_pool`) est injecte : son cycle de vie (ouverture,
    fermeture) est gere par l'appelant. Les retries et la concurrence sont geres
    cote worker `arq` (slice ulterieure).
    """

    def __init__(self, pool: ArqRedis) -> None:
        self._pool = pool

    async def enqueue(self, job: DeploymentJob) -> None:
        payload = serialize_deployment_job(job)
        await self._pool.enqueue_job(
            DEPLOYMENT_JOB_FUNCTION,
            _queue_name=DEPLOYMENT_QUEUE_NAME,
            kind=payload["kind"],
            deployment_id=payload["deployment_id"],
        )
