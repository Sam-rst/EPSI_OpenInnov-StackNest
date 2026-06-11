"""Tests unitaires de ArqStackJobQueue avec un pool arq factice."""

from typing import Any
from uuid import UUID

from app.stack.domain.enums.stack_job_kind import StackJobKind
from app.stack.domain.value_objects.stack_job import StackJob
from app.stack.infrastructure.queue.arq_stack_job_queue import ArqStackJobQueue
from app.stack.infrastructure.queue.stack_arq_settings import (
    STACK_JOB_FUNCTION,
    STACK_QUEUE_NAME,
)

_STACK_ID = UUID("11111111-1111-1111-1111-111111111111")


class _FakeArqPool:
    """Capture les appels a `enqueue_job` sans contacter Redis."""

    def __init__(self) -> None:
        self.calls: list[tuple[tuple[Any, ...], dict[str, Any]]] = []

    async def enqueue_job(self, *args: Any, **kwargs: Any) -> None:
        self.calls.append((args, kwargs))
        return None


class TestArqStackJobQueue:
    async def test_enfile_la_fonction_worker_attendue(self) -> None:
        pool = _FakeArqPool()
        queue = ArqStackJobQueue(pool)  # type: ignore[arg-type]

        await queue.enqueue(StackJob(kind=StackJobKind.PROVISION, stack_id=_STACK_ID))

        (function_name, *_), _ = pool.calls[0]
        assert function_name == STACK_JOB_FUNCTION

    async def test_transmet_le_job_serialise_en_kwargs(self) -> None:
        pool = _FakeArqPool()
        queue = ArqStackJobQueue(pool)  # type: ignore[arg-type]

        await queue.enqueue(StackJob(kind=StackJobKind.DESTROY, stack_id=_STACK_ID))

        _, kwargs = pool.calls[0]
        assert kwargs["kind"] == "destroy"
        assert kwargs["stack_id"] == str(_STACK_ID)

    async def test_cible_la_file_dediee_a_la_stack(self) -> None:
        pool = _FakeArqPool()
        queue = ArqStackJobQueue(pool)  # type: ignore[arg-type]

        await queue.enqueue(StackJob(kind=StackJobKind.PROVISION, stack_id=_STACK_ID))

        _, kwargs = pool.calls[0]
        assert kwargs["_queue_name"] == STACK_QUEUE_NAME
