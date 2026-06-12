"""Tests unitaires de l'adaptateur StackActions (delegation reelle au composeur).

Verifie que l'adaptateur appelle le use case REEL `CreateStack` du slice stack
(aucune duplication) : valide la composition, persiste la stack `pending`, enfile
le provisioning via la `StackJobQueue` et renvoie l'identifiant de la stack creee.
Utilise les fakes infra du slice stack (depot, file, reader).
"""

from uuid import uuid4

from app.chat.domain.value_objects.stack_composition_spec import (
    StackLinkSpec,
    StackServiceSpec,
)
from app.chat.infrastructure.adapters.stack_actions_adapter import StackActionsAdapter
from app.stack.application.__tests__.fakes import (
    FakeStackJobQueue,
    FakeStackRepository,
    FakeStackTemplateReader,
    docker_ref,
)
from app.stack.domain.enums.stack_job_kind import StackJobKind


def _adapter(
    repository: FakeStackRepository,
    queue: FakeStackJobQueue,
    reader: FakeStackTemplateReader,
) -> StackActionsAdapter:
    return StackActionsAdapter(repository=repository, queue=queue, reader=reader)


class TestComposeDelegation:
    async def test_compose_cree_la_stack_et_enfile_le_provisioning(self) -> None:
        owner = uuid4()
        db_id, api_id = uuid4(), uuid4()
        repository = FakeStackRepository()
        queue = FakeStackJobQueue()
        reader = FakeStackTemplateReader(
            {(db_id, "16"): docker_ref("PostgreSQL"), (api_id, "20"): docker_ref("Node")}
        )
        adapter = _adapter(repository, queue, reader)

        stack_id = await adapter.compose(
            owner_id=owner,
            name="mon-app",
            services=(
                StackServiceSpec(template_id=db_id, alias="db", version="16"),
                StackServiceSpec(template_id=api_id, alias="api", version="20"),
            ),
            links=(
                StackLinkSpec(from_alias="api", to_alias="db", var_mappings={"H": "{to.alias}"}),
            ),
        )

        assert repository.added_stacks[0].owner_id == owner
        assert repository.added_stacks[0].name == "mon-app"
        assert {service.alias for service in repository.added_services} == {"db", "api"}
        assert len(repository.added_links) == 1
        assert queue.enqueued[-1].kind == StackJobKind.PROVISION
        assert stack_id == str(repository.added_stacks[0].id)

    async def test_les_services_recoivent_un_order_index_croissant(self) -> None:
        owner = uuid4()
        db_id, api_id = uuid4(), uuid4()
        repository = FakeStackRepository()
        reader = FakeStackTemplateReader(
            {(db_id, "16"): docker_ref(), (api_id, "20"): docker_ref("Node")}
        )
        adapter = _adapter(repository, FakeStackJobQueue(), reader)

        await adapter.compose(
            owner_id=owner,
            name="x",
            services=(
                StackServiceSpec(template_id=db_id, alias="db", version="16"),
                StackServiceSpec(template_id=api_id, alias="api", version="20"),
            ),
            links=(),
        )

        by_alias = {service.alias: service for service in repository.added_services}
        assert by_alias["db"].order_index == 0
        assert by_alias["api"].order_index == 1
