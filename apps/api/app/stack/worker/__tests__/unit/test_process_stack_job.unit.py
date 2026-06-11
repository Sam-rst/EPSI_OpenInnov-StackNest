"""Tests unitaires de la fonction worker process_stack_job (avec ctx fake)."""

from typing import Any
from uuid import uuid4

from app.stack.domain.enums.stack_job_kind import StackJobKind
from app.stack.domain.value_objects.stack_job import StackJob
from app.worker_main import process_stack_job


class _RecordingExecutor:
    """Capture le job execute pour assertion (remplace l'executor reel en ctx)."""

    def __init__(self) -> None:
        self.jobs: list[StackJob] = []

    async def __call__(self, job: StackJob) -> None:
        self.jobs.append(job)


class TestProcessStackJob:
    async def test_deserialise_le_job_et_delegue_a_l_executor(self) -> None:
        executor = _RecordingExecutor()
        ctx: dict[str, Any] = {"execute_stack_job": executor}
        stack_id = uuid4()

        await process_stack_job(ctx, kind=StackJobKind.PROVISION.value, stack_id=str(stack_id))

        assert len(executor.jobs) == 1
        assert executor.jobs[0].kind is StackJobKind.PROVISION
        assert executor.jobs[0].stack_id == stack_id

    async def test_propage_le_type_destroy(self) -> None:
        executor = _RecordingExecutor()
        ctx: dict[str, Any] = {"execute_stack_job": executor}

        await process_stack_job(ctx, kind=StackJobKind.DESTROY.value, stack_id=str(uuid4()))

        assert executor.jobs[0].kind is StackJobKind.DESTROY
