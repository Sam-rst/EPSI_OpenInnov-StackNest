"""Tests unitaires du use case ListStacks (isolation par proprietaire)."""

from uuid import uuid4

from app.stack.application.__tests__.fakes import FakeStackRepository
from app.stack.application.list_stacks import ListStacks
from app.stack.domain.entities.stack import Stack
from app.stack.domain.enums.stack_status import StackStatus


def _stack(owner_id: object, name: str) -> Stack:
    return Stack(id=uuid4(), owner_id=owner_id, name=name, status=StackStatus.PENDING)  # type: ignore[arg-type]


class TestListStacks:
    async def test_ne_renvoie_que_les_stacks_de_l_owner(self) -> None:
        owner_id = uuid4()
        other_id = uuid4()
        repository = FakeStackRepository(
            [
                _stack(owner_id, "a"),
                _stack(owner_id, "b"),
                _stack(other_id, "c"),
            ]
        )

        stacks = await ListStacks(repository).execute(owner_id)

        assert {s.name for s in stacks} == {"a", "b"}
        assert all(s.owner_id == owner_id for s in stacks)

    async def test_sans_stack_renvoie_vide(self) -> None:
        repository = FakeStackRepository()

        assert await ListStacks(repository).execute(uuid4()) == []
