"""Tests unitaires du use case DestroyDeployment (avec fakes)."""

from uuid import uuid4

import pytest

from app.deployment.application.__tests__.fakes import (
    FakeDeploymentRepository,
    FakeJobQueue,
    make_deployment,
)
from app.deployment.application.destroy_deployment import DestroyDeployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.exceptions.deployment_not_found import (
    DeploymentNotFoundException,
)
from app.deployment.domain.exceptions.invalid_deployment_state import (
    InvalidDeploymentStateException,
)


class TestDestroyDeployment:
    async def test_enqueue_un_job_destroy_depuis_running(self) -> None:
        owner_id = uuid4()
        deployment = make_deployment(owner_id=owner_id, status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        queue = FakeJobQueue()
        use_case = DestroyDeployment(repository=repository, queue=queue)

        await use_case.execute(deployment.id, owner_id)

        assert len(queue.enqueued) == 1
        assert queue.enqueued[0].kind is JobKind.DESTROY
        assert queue.enqueued[0].deployment_id == deployment.id

    async def test_enqueue_un_job_destroy_depuis_stopped(self) -> None:
        owner_id = uuid4()
        deployment = make_deployment(owner_id=owner_id, status=DeploymentStatus.STOPPED)
        repository = FakeDeploymentRepository([deployment])
        queue = FakeJobQueue()
        use_case = DestroyDeployment(repository=repository, queue=queue)

        await use_case.execute(deployment.id, owner_id)

        assert queue.enqueued[0].kind is JobKind.DESTROY

    async def test_deploiement_absent_leve_404(self) -> None:
        repository = FakeDeploymentRepository([])
        queue = FakeJobQueue()
        use_case = DestroyDeployment(repository=repository, queue=queue)

        with pytest.raises(DeploymentNotFoundException):
            await use_case.execute(uuid4(), uuid4())
        assert queue.enqueued == []

    async def test_destroy_d_un_deploiement_deja_detruit_leve_409(self) -> None:
        owner_id = uuid4()
        deployment = make_deployment(owner_id=owner_id, status=DeploymentStatus.DESTROYED)
        repository = FakeDeploymentRepository([deployment])
        queue = FakeJobQueue()
        use_case = DestroyDeployment(repository=repository, queue=queue)

        with pytest.raises(InvalidDeploymentStateException):
            await use_case.execute(deployment.id, owner_id)
        assert queue.enqueued == []
