"""Tests unitaires de ArqJobQueue avec un pool arq factice."""

from typing import Any
from uuid import UUID

from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.value_objects.deployment_job import DeploymentJob
from app.deployment.infrastructure.queue.arq_job_queue import ArqJobQueue
from app.deployment.infrastructure.queue.arq_settings import (
    DEPLOYMENT_JOB_FUNCTION,
    DEPLOYMENT_QUEUE_NAME,
)

_DEPLOYMENT_ID = UUID("11111111-1111-1111-1111-111111111111")


class _FakeArqPool:
    """Capture les appels a `enqueue_job` sans contacter Redis."""

    def __init__(self) -> None:
        self.calls: list[tuple[tuple[Any, ...], dict[str, Any]]] = []

    async def enqueue_job(self, *args: Any, **kwargs: Any) -> None:
        self.calls.append((args, kwargs))
        return None


class TestArqJobQueue:
    async def test_enfile_la_fonction_worker_attendue(self) -> None:
        pool = _FakeArqPool()
        queue = ArqJobQueue(pool)  # type: ignore[arg-type]

        await queue.enqueue(DeploymentJob(kind=JobKind.PROVISION, deployment_id=_DEPLOYMENT_ID))

        (function_name, *_), _ = pool.calls[0]
        assert function_name == DEPLOYMENT_JOB_FUNCTION

    async def test_transmet_le_job_serialise_en_kwargs(self) -> None:
        pool = _FakeArqPool()
        queue = ArqJobQueue(pool)  # type: ignore[arg-type]

        await queue.enqueue(DeploymentJob(kind=JobKind.STOP, deployment_id=_DEPLOYMENT_ID))

        _, kwargs = pool.calls[0]
        assert kwargs["kind"] == "stop"
        assert kwargs["deployment_id"] == str(_DEPLOYMENT_ID)

    async def test_cible_la_file_dediee_au_deploiement(self) -> None:
        pool = _FakeArqPool()
        queue = ArqJobQueue(pool)  # type: ignore[arg-type]

        await queue.enqueue(DeploymentJob(kind=JobKind.DESTROY, deployment_id=_DEPLOYMENT_ID))

        _, kwargs = pool.calls[0]
        assert kwargs["_queue_name"] == DEPLOYMENT_QUEUE_NAME

    async def test_un_appel_par_job_enfile(self) -> None:
        pool = _FakeArqPool()
        queue = ArqJobQueue(pool)  # type: ignore[arg-type]

        await queue.enqueue(DeploymentJob(kind=JobKind.START, deployment_id=_DEPLOYMENT_ID))
        await queue.enqueue(DeploymentJob(kind=JobKind.STOP, deployment_id=_DEPLOYMENT_ID))

        assert len(pool.calls) == 2
