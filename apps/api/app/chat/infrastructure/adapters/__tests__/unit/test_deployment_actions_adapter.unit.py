"""Tests unitaires de l'adaptateur DeploymentActions (delegation reelle).

Verifie que l'adaptateur appelle les use cases REELS du slice deploiement
(`CreateDeployment`, `StopDeployment`, ...) — aucune duplication de logique — et
renvoie l'identifiant du deploiement concerne. Utilise les fakes infra du slice
deploiement (depot, file, reader) : c'est bien le use case reel qui s'execute.
"""

from uuid import uuid4

import pytest

from app.chat.infrastructure.adapters.deployment_actions_adapter import (
    DeploymentActionsAdapter,
)
from app.deployment.application.__tests__.fakes import (
    FakeDeploymentRepository,
    FakeJobQueue,
    FakeTemplateProvisioningReader,
    docker_descriptor,
    make_deployment,
)
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.enums.job_kind import JobKind


def _adapter(
    repository: FakeDeploymentRepository,
    queue: FakeJobQueue,
    reader: FakeTemplateProvisioningReader,
) -> DeploymentActionsAdapter:
    return DeploymentActionsAdapter(repository=repository, queue=queue, reader=reader)


class TestDeploy:
    async def test_deploy_cree_un_deploiement_et_enfile_le_provisioning(self) -> None:
        owner = uuid4()
        template_id = uuid4()
        repository = FakeDeploymentRepository()
        queue = FakeJobQueue()
        reader = FakeTemplateProvisioningReader({(template_id, "16"): docker_descriptor()})
        adapter = _adapter(repository, queue, reader)

        deployment_id = await adapter.deploy(
            owner_id=owner, template_id=template_id, version="16", name="db", params={"db": "app"}
        )

        assert repository.added[0].owner_id == owner
        assert queue.enqueued[-1].kind == JobKind.PROVISION
        assert deployment_id == str(repository.added[0].id)


class TestLifecycle:
    async def test_stop_delegue_au_use_case_et_renvoie_l_id(self) -> None:
        owner = uuid4()
        deployment = make_deployment(owner_id=owner, status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        queue = FakeJobQueue()
        adapter = _adapter(repository, queue, FakeTemplateProvisioningReader())

        result = await adapter.stop(owner_id=owner, deployment_id=deployment.id)

        assert queue.enqueued[-1].kind == JobKind.STOP
        assert result == str(deployment.id)

    async def test_start_delegue_au_use_case(self) -> None:
        owner = uuid4()
        deployment = make_deployment(owner_id=owner, status=DeploymentStatus.STOPPED)
        repository = FakeDeploymentRepository([deployment])
        queue = FakeJobQueue()
        adapter = _adapter(repository, queue, FakeTemplateProvisioningReader())

        result = await adapter.start(owner_id=owner, deployment_id=deployment.id)

        assert queue.enqueued[-1].kind == JobKind.START
        assert result == str(deployment.id)

    async def test_regenerate_delegue_au_use_case(self) -> None:
        owner = uuid4()
        deployment = make_deployment(owner_id=owner, status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        queue = FakeJobQueue()
        adapter = _adapter(repository, queue, FakeTemplateProvisioningReader())

        result = await adapter.regenerate_password(owner_id=owner, deployment_id=deployment.id)

        assert queue.enqueued[-1].kind == JobKind.REGENERATE
        assert result == str(deployment.id)

    async def test_stop_d_un_deploiement_d_autrui_remonte_404(self) -> None:
        from app.deployment.domain.exceptions.deployment_not_found import (
            DeploymentNotFoundException,
        )

        deployment = make_deployment(owner_id=uuid4(), status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        adapter = _adapter(repository, FakeJobQueue(), FakeTemplateProvisioningReader())

        with pytest.raises(DeploymentNotFoundException):
            await adapter.stop(owner_id=uuid4(), deployment_id=deployment.id)
