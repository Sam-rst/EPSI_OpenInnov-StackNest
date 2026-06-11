"""Tests unitaires du use case DeleteStack (controle owner + suppression base).

Au lot 2, la suppression est purement en base (cascade services + liens). La
destruction reelle des conteneurs viendra au lot 3 (worker `compose down`). Une
stack inexistante ou d'autrui leve 404 (`StackNotFoundException`) sans rien
supprimer.
"""

from uuid import uuid4

import pytest

from app.stack.application.__tests__.fakes import FakeStackRepository
from app.stack.application.delete_stack import DeleteStack
from app.stack.domain.entities.stack import Stack
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.exceptions.stack_not_found import StackNotFoundException


def _stack(owner_id: object) -> Stack:
    return Stack(id=uuid4(), owner_id=owner_id, name="a-supprimer", status=StackStatus.PENDING)  # type: ignore[arg-type]


class TestDeleteStack:
    async def test_supprime_la_stack_possedee(self) -> None:
        repository = FakeStackRepository()
        owner_id = uuid4()
        stack = _stack(owner_id)
        await repository.add(stack)

        await DeleteStack(repository).execute(stack.id, owner_id)

        assert repository.deleted == [stack.id]
        assert await repository.get_by_id(stack.id) is None

    async def test_stack_d_autrui_renvoie_404_sans_supprimer(self) -> None:
        repository = FakeStackRepository()
        stack = _stack(uuid4())
        await repository.add(stack)

        with pytest.raises(StackNotFoundException):
            await DeleteStack(repository).execute(stack.id, uuid4())

        assert repository.deleted == []
        assert await repository.get_by_id(stack.id) is not None

    async def test_stack_inconnue_renvoie_404(self) -> None:
        repository = FakeStackRepository()

        with pytest.raises(StackNotFoundException):
            await DeleteStack(repository).execute(uuid4(), uuid4())

        assert repository.deleted == []
