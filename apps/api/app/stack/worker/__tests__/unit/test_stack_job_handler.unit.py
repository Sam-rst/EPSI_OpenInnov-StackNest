"""Tests unitaires du handler de jobs worker de stack (PROVISION / DESTROY)."""

from uuid import UUID, uuid4

from app.catalog.domain.enums.engine_kind import EngineKind
from app.deployment.domain.value_objects.template_provisioning import TemplateProvisioning
from app.stack.application.__tests__.fakes import FakeStackRepository
from app.stack.domain.entities.stack import Stack
from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_job_kind import StackJobKind
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.value_objects.service_provision_result import ServiceProvisionResult
from app.stack.domain.value_objects.stack_job import StackJob
from app.stack.worker.__tests__.fakes import (
    FailingStackProvisioner,
    FakeStackEventPublisher,
    FakeStackProvisioner,
)
from app.stack.worker.stack_job_handler import StackJobHandler

_DB_TEMPLATE = uuid4()
_API_TEMPLATE = uuid4()


def _stack(status: StackStatus = StackStatus.PENDING) -> Stack:
    return Stack(id=uuid4(), owner_id=uuid4(), name="ma-stack", status=status)


def _service(
    *, stack_id: UUID, alias: str, template_id: UUID, version: str, order: int
) -> StackService:
    return StackService(
        id=uuid4(),
        stack_id=stack_id,
        template_id=template_id,
        version=version,
        alias=alias,
        service_status=ServiceStatus.PENDING,
        order_index=order,
    )


def _descriptors() -> dict[tuple[UUID, str], TemplateProvisioning]:
    return {
        (_DB_TEMPLATE, "16"): TemplateProvisioning(
            image_repository="postgres",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
            engine=EngineKind.DOCKER,
            template_name="PostgreSQL",
        ),
        (_API_TEMPLATE, "1.0"): TemplateProvisioning(
            image_repository="myapp",
            internal_port=8080,
            secret_env=None,
            engine=EngineKind.DOCKER,
            template_name="API",
        ),
    }


async def _seed_two_service_stack(repository: FakeStackRepository) -> Stack:
    stack = _stack()
    await repository.add(stack)
    await repository.add_service(
        _service(stack_id=stack.id, alias="db", template_id=_DB_TEMPLATE, version="16", order=0)
    )
    await repository.add_service(
        _service(stack_id=stack.id, alias="api", template_id=_API_TEMPLATE, version="1.0", order=1)
    )
    return stack


def _handler(
    *,
    repository: FakeStackRepository,
    provisioner: FakeStackProvisioner,
    publisher: FakeStackEventPublisher,
) -> StackJobHandler:
    from app.deployment.application.__tests__.fakes import (
        FakeTemplateProvisioningReader,
        StubSecretGenerator,
    )

    return StackJobHandler(
        repository=repository,
        provisioner=provisioner,
        publisher=publisher,
        reader=FakeTemplateProvisioningReader(_descriptors()),
        secret_generator=StubSecretGenerator("S3CR3T"),
    )


class TestProvision:
    async def test_tous_running_persiste_ports_refs_et_statut_running(self) -> None:
        repository = FakeStackRepository()
        stack = await _seed_two_service_stack(repository)
        provisioner = FakeStackProvisioner(
            results=[
                ServiceProvisionResult(
                    alias="db", host="localhost", container_ref="stack-db-1", published_port=32768
                ),
                ServiceProvisionResult(
                    alias="api", host="localhost", container_ref="stack-api-1", published_port=32769
                ),
            ]
        )
        publisher = FakeStackEventPublisher()
        handler = _handler(repository=repository, provisioner=provisioner, publisher=publisher)

        await handler.handle(StackJob(StackJobKind.PROVISION, stack.id))

        stored_stack = await repository.get_by_id(stack.id)
        assert stored_stack is not None
        assert stored_stack.status is StackStatus.RUNNING
        services = await repository.list_services(stack.id)
        db_stored = next(s for s in services if s.alias == "db")
        assert db_stored.service_status is ServiceStatus.RUNNING
        assert db_stored.published_port == 32768
        assert db_stored.container_ref == "stack-db-1"

    async def test_publie_provisioning_puis_running_au_niveau_stack(self) -> None:
        repository = FakeStackRepository()
        stack = await _seed_two_service_stack(repository)
        provisioner = FakeStackProvisioner(
            results=[
                ServiceProvisionResult(
                    alias="db", host="localhost", container_ref="stack-db-1", published_port=32768
                ),
                ServiceProvisionResult(
                    alias="api", host="localhost", container_ref="stack-api-1", published_port=32769
                ),
            ]
        )
        publisher = FakeStackEventPublisher()
        handler = _handler(repository=repository, provisioner=provisioner, publisher=publisher)

        await handler.handle(StackJob(StackJobKind.PROVISION, stack.id))

        assert publisher.stack_statuses() == ["provisioning", "running"]

    async def test_publie_un_event_par_service_avec_acces(self) -> None:
        repository = FakeStackRepository()
        stack = await _seed_two_service_stack(repository)
        provisioner = FakeStackProvisioner(
            results=[
                ServiceProvisionResult(
                    alias="db", host="localhost", container_ref="stack-db-1", published_port=32768
                ),
                ServiceProvisionResult(
                    alias="api", host="localhost", container_ref="stack-api-1", published_port=32769
                ),
            ]
        )
        publisher = FakeStackEventPublisher()
        handler = _handler(repository=repository, provisioner=provisioner, publisher=publisher)

        await handler.handle(StackJob(StackJobKind.PROVISION, stack.id))

        service_events = {e.alias: e for e in publisher.service_events()}
        assert service_events["db"].service_status is ServiceStatus.RUNNING
        assert service_events["db"].access_url == "localhost:32768"
        assert service_events["api"].access_url == "localhost:32769"

    async def test_aucun_secret_persiste_ni_publie(self) -> None:
        repository = FakeStackRepository()
        stack = await _seed_two_service_stack(repository)
        provisioner = FakeStackProvisioner(
            results=[
                ServiceProvisionResult(
                    alias="db", host="localhost", container_ref="stack-db-1", published_port=32768
                ),
                ServiceProvisionResult(
                    alias="api", host="localhost", container_ref="stack-api-1", published_port=32769
                ),
            ]
        )
        publisher = FakeStackEventPublisher()
        handler = _handler(repository=repository, provisioner=provisioner, publisher=publisher)

        await handler.handle(StackJob(StackJobKind.PROVISION, stack.id))

        # Le secret genere n'apparait dans aucun service persiste.
        services = await repository.list_services(stack.id)
        assert all("S3CR3T" not in str(s.params) for s in services)
        # Ni dans aucun event publie.
        assert all("S3CR3T" not in str(e) for _, e in publisher.events)

    async def test_echec_compose_up_passe_failed(self) -> None:
        repository = FakeStackRepository()
        stack = await _seed_two_service_stack(repository)
        publisher = FakeStackEventPublisher()
        handler = _handler(
            repository=repository, provisioner=FailingStackProvisioner(), publisher=publisher
        )

        await handler.handle(StackJob(StackJobKind.PROVISION, stack.id))

        stored = await repository.get_by_id(stack.id)
        assert stored is not None
        assert stored.status is StackStatus.FAILED
        assert publisher.stack_statuses()[-1] == "failed"

    async def test_stack_absente_ne_plante_pas(self) -> None:
        repository = FakeStackRepository()
        publisher = FakeStackEventPublisher()
        handler = _handler(
            repository=repository, provisioner=FakeStackProvisioner(), publisher=publisher
        )

        await handler.handle(StackJob(StackJobKind.PROVISION, uuid4()))

        assert publisher.events == []


class TestDestroy:
    async def test_detruit_le_projet_et_passe_destroyed(self) -> None:
        repository = FakeStackRepository()
        stack = await _seed_two_service_stack(repository)
        provisioner = FakeStackProvisioner()
        publisher = FakeStackEventPublisher()
        handler = _handler(repository=repository, provisioner=provisioner, publisher=publisher)

        await handler.handle(StackJob(StackJobKind.DESTROY, stack.id))

        stored = await repository.get_by_id(stack.id)
        assert stored is not None
        assert stored.status is StackStatus.DESTROYED
        assert provisioner.down_calls == [f"stack_{stack.id}"]
        assert publisher.stack_statuses() == ["destroying", "destroyed"]

    async def test_echec_destroy_passe_failed(self) -> None:
        repository = FakeStackRepository()
        stack = await _seed_two_service_stack(repository)
        publisher = FakeStackEventPublisher()
        handler = _handler(
            repository=repository, provisioner=FailingStackProvisioner(), publisher=publisher
        )

        await handler.handle(StackJob(StackJobKind.DESTROY, stack.id))

        stored = await repository.get_by_id(stack.id)
        assert stored is not None
        assert stored.status is StackStatus.FAILED
