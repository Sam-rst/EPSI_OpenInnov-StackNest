"""Tests unitaires du use case GetStack : detail (stack + services + liens).

Compose la vue de detail en appelant le repository (`get_by_id` + `list_services`
+ `list_links`). Une stack inexistante ou n'appartenant pas a l'utilisateur leve
la meme 404 (`StackNotFoundException`) : on ne divulgue pas son existence.
"""

from uuid import uuid4

import pytest

from app.stack.application.__tests__.fakes import FakeStackRepository
from app.stack.application.get_stack import GetStack
from app.stack.domain.entities.stack import Stack
from app.stack.domain.entities.stack_link import StackLink
from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.exceptions.stack_not_found import StackNotFoundException


async def _seed_stack(repository: FakeStackRepository, owner_id: object) -> Stack:
    stack = Stack(id=uuid4(), owner_id=owner_id, name="detail", status=StackStatus.PENDING)  # type: ignore[arg-type]
    await repository.add(stack)
    db = StackService(
        id=uuid4(),
        stack_id=stack.id,
        template_id=uuid4(),
        version="16",
        alias="db",
        service_status=ServiceStatus.PENDING,
        order_index=0,
    )
    api = StackService(
        id=uuid4(),
        stack_id=stack.id,
        template_id=uuid4(),
        version="1",
        alias="api",
        service_status=ServiceStatus.PENDING,
        order_index=1,
    )
    await repository.add_service(db)
    await repository.add_service(api)
    await repository.add_link(
        StackLink(
            id=uuid4(),
            stack_id=stack.id,
            from_service_id=api.id,
            to_service_id=db.id,
        )
    )
    return stack


class TestGetStack:
    async def test_detail_compose_stack_services_et_liens(self) -> None:
        repository = FakeStackRepository()
        owner_id = uuid4()
        stack = await _seed_stack(repository, owner_id)

        detail = await GetStack(repository).execute(stack.id, owner_id)

        assert detail.stack.id == stack.id
        assert [s.alias for s in detail.services] == ["db", "api"]
        assert len(detail.links) == 1

    async def test_stack_d_autrui_renvoie_404(self) -> None:
        repository = FakeStackRepository()
        stack = await _seed_stack(repository, uuid4())

        with pytest.raises(StackNotFoundException):
            await GetStack(repository).execute(stack.id, uuid4())

    async def test_stack_inconnue_renvoie_404(self) -> None:
        repository = FakeStackRepository()

        with pytest.raises(StackNotFoundException):
            await GetStack(repository).execute(uuid4(), uuid4())
