"""Adaptateur arq de l'interface StackJobQueue (enfilage Redis des jobs worker)."""

from arq.connections import ArqRedis

from app.stack.domain.interfaces.stack_job_queue import StackJobQueue
from app.stack.domain.value_objects.stack_job import StackJob
from app.stack.infrastructure.queue.stack_arq_settings import (
    STACK_JOB_FUNCTION,
    STACK_QUEUE_NAME,
)
from app.stack.infrastructure.queue.stack_job_serializer import serialize_stack_job


class ArqStackJobQueue(StackJobQueue):
    """Implementation de StackJobQueue par la file `arq` sur Redis.

    Enfile la fonction worker `process_stack_job` dans la file dediee
    `stacknest:stack` avec le job serialise en arguments nommes. Le pool
    `ArqRedis` (cree via `create_pool`) est injecte : son cycle de vie est gere
    par l'appelant. Les retries et la concurrence sont geres cote worker `arq`.
    """

    def __init__(self, pool: ArqRedis) -> None:
        self._pool = pool

    async def enqueue(self, job: StackJob) -> None:
        payload = serialize_stack_job(job)
        await self._pool.enqueue_job(
            STACK_JOB_FUNCTION,
            _queue_name=STACK_QUEUE_NAME,
            kind=payload["kind"],
            stack_id=payload["stack_id"],
        )
