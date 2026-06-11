"""Tests unitaires du use case DestroyStack (enfile un job DESTROY, isole owner)."""

from uuid import uuid4

import pytest

from app.stack.application.__tests__.fakes import FakeStackJobQueue, FakeStackRepository
from app.stack.application.destroy_stack import DestroyStack
from app.stack.domain.entities.stack import Stack
from app.stack.domain.enums.stack_job_kind import StackJobKind
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.exceptions.stack_not_found import StackNotFoundException


def _stack(owner_id) -> Stack:  # type: ignore[no-untyped-def]
    return Stack(id=uuid4(), owner_id=owner_id, name="ma-stack", status=StackStatus.RUNNING)


class TestDestroyStack:
    async def test_enfile_un_job_destroy_pour_la_stack_possedee(self) -> None:
        owner_id = uuid4()
        stack = _stack(owner_id)
        repository = FakeStackRepository([stack])
        queue = FakeStackJobQueue()

        await DestroyStack(repository=repository, queue=queue).execute(stack.id, owner_id)

        assert len(queue.enqueued) == 1
        assert queue.enqueued[0].kind is StackJobKind.DESTROY
        assert queue.enqueued[0].stack_id == stack.id

    async def test_stack_d_un_autre_owner_leve_404_sans_enfiler(self) -> None:
        stack = _stack(uuid4())
        repository = FakeStackRepository([stack])
        queue = FakeStackJobQueue()

        with pytest.raises(StackNotFoundException):
            await DestroyStack(repository=repository, queue=queue).execute(stack.id, uuid4())

        assert queue.enqueued == []

    async def test_stack_inexistante_leve_404(self) -> None:
        repository = FakeStackRepository()
        queue = FakeStackJobQueue()

        with pytest.raises(StackNotFoundException):
            await DestroyStack(repository=repository, queue=queue).execute(uuid4(), uuid4())
