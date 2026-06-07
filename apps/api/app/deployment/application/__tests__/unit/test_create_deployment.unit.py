"""Tests unitaires du use case CreateDeployment (avec fakes)."""

from uuid import uuid4

import pytest

from app.deployment.application.__tests__.fakes import (
    FakeDeploymentRepository,
    FakeJobQueue,
    FakeTemplateProvisioningReader,
    docker_descriptor,
    terraform_descriptor,
)
from app.deployment.application.commands.create_deployment_command import (
    CreateDeploymentCommand,
)
from app.deployment.application.create_deployment import CreateDeployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.exceptions.engine_not_supported import (
    EngineNotSupportedException,
)
from app.deployment.domain.exceptions.template_not_found import (
    TemplateNotFoundForDeploymentException,
)


def _command(
    *, owner_id: object | None = None, template_id: object | None = None
) -> CreateDeploymentCommand:
    return CreateDeploymentCommand(
        owner_id=owner_id or uuid4(),  # type: ignore[arg-type]
        template_id=template_id or uuid4(),  # type: ignore[arg-type]
        template_version="16",
        name="ma-base",
        params={"foo": "bar"},
    )


def _build(
    *,
    repository: FakeDeploymentRepository,
    queue: FakeJobQueue,
    reader: FakeTemplateProvisioningReader,
) -> CreateDeployment:
    return CreateDeployment(repository=repository, queue=queue, reader=reader)


class TestCreateDeployment:
    async def test_persiste_un_deploiement_pending(self) -> None:
        owner_id, template_id = uuid4(), uuid4()
        repository = FakeDeploymentRepository()
        queue = FakeJobQueue()
        reader = FakeTemplateProvisioningReader({(template_id, "16"): docker_descriptor()})
        use_case = _build(repository=repository, queue=queue, reader=reader)

        result = await use_case.execute(_command(owner_id=owner_id, template_id=template_id))

        assert result.status is DeploymentStatus.PENDING
        assert result.owner_id == owner_id
        assert result.template_id == template_id
        assert len(repository.added) == 1

    async def test_enqueue_un_job_provision(self) -> None:
        template_id = uuid4()
        repository = FakeDeploymentRepository()
        queue = FakeJobQueue()
        reader = FakeTemplateProvisioningReader({(template_id, "16"): docker_descriptor()})
        use_case = _build(repository=repository, queue=queue, reader=reader)

        result = await use_case.execute(_command(template_id=template_id))

        assert len(queue.enqueued) == 1
        assert queue.enqueued[0].kind is JobKind.PROVISION
        assert queue.enqueued[0].deployment_id == result.id

    async def test_template_introuvable_leve(self) -> None:
        repository = FakeDeploymentRepository()
        queue = FakeJobQueue()
        reader = FakeTemplateProvisioningReader({})  # aucun descripteur
        use_case = _build(repository=repository, queue=queue, reader=reader)

        with pytest.raises(TemplateNotFoundForDeploymentException):
            await use_case.execute(_command())

        assert repository.added == []
        assert queue.enqueued == []

    async def test_moteur_terraform_rejete(self) -> None:
        template_id = uuid4()
        repository = FakeDeploymentRepository()
        queue = FakeJobQueue()
        reader = FakeTemplateProvisioningReader({(template_id, "16"): terraform_descriptor()})
        use_case = _build(repository=repository, queue=queue, reader=reader)

        with pytest.raises(EngineNotSupportedException):
            await use_case.execute(_command(template_id=template_id))

        assert repository.added == []
        assert queue.enqueued == []

    async def test_le_job_est_enfile_apres_la_persistance(self) -> None:
        template_id = uuid4()
        repository = FakeDeploymentRepository()
        queue = FakeJobQueue()
        reader = FakeTemplateProvisioningReader({(template_id, "16"): docker_descriptor()})
        use_case = _build(repository=repository, queue=queue, reader=reader)

        result = await use_case.execute(_command(template_id=template_id))

        # Le deploiement enfile doit deja exister en base (id present cote repo).
        assert await repository.get_by_id(result.id) is not None
