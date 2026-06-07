"""Tests unitaires du use case RegeneratePassword (avec fakes)."""

from uuid import uuid4

import pytest

from app.deployment.application.__tests__.fakes import (
    FakeDeploymentRepository,
    FakeJobQueue,
    make_deployment,
)
from app.deployment.application.regenerate_password import RegeneratePassword
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.exceptions.deployment_not_found import (
    DeploymentNotFoundException,
)
from app.deployment.domain.exceptions.invalid_deployment_state import (
    InvalidDeploymentStateException,
)


class TestRegeneratePassword:
    async def test_enqueue_un_job_regenerate_sur_running(self) -> None:
        owner_id = uuid4()
        deployment = make_deployment(owner_id=owner_id, status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        queue = FakeJobQueue()
        use_case = RegeneratePassword(repository=repository, queue=queue)

        await use_case.execute(deployment.id, owner_id)

        assert len(queue.enqueued) == 1
        assert queue.enqueued[0].kind is JobKind.REGENERATE
        assert queue.enqueued[0].deployment_id == deployment.id

    async def test_enqueue_un_job_regenerate_sur_stopped(self) -> None:
        owner_id = uuid4()
        deployment = make_deployment(owner_id=owner_id, status=DeploymentStatus.STOPPED)
        repository = FakeDeploymentRepository([deployment])
        queue = FakeJobQueue()
        use_case = RegeneratePassword(repository=repository, queue=queue)

        await use_case.execute(deployment.id, owner_id)

        assert queue.enqueued[0].kind is JobKind.REGENERATE

    async def test_deploiement_absent_leve_404(self) -> None:
        repository = FakeDeploymentRepository([])
        queue = FakeJobQueue()
        use_case = RegeneratePassword(repository=repository, queue=queue)

        with pytest.raises(DeploymentNotFoundException):
            await use_case.execute(uuid4(), uuid4())
        assert queue.enqueued == []

    async def test_deploiement_autre_owner_leve_404(self) -> None:
        deployment = make_deployment(owner_id=uuid4(), status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        queue = FakeJobQueue()
        use_case = RegeneratePassword(repository=repository, queue=queue)

        with pytest.raises(DeploymentNotFoundException):
            await use_case.execute(deployment.id, uuid4())
        assert queue.enqueued == []

    async def test_regenerate_sur_pending_leve_409(self) -> None:
        owner_id = uuid4()
        deployment = make_deployment(owner_id=owner_id, status=DeploymentStatus.PENDING)
        repository = FakeDeploymentRepository([deployment])
        queue = FakeJobQueue()
        use_case = RegeneratePassword(repository=repository, queue=queue)

        with pytest.raises(InvalidDeploymentStateException):
            await use_case.execute(deployment.id, owner_id)
        assert queue.enqueued == []

    async def test_regenerate_sur_detruit_leve_409(self) -> None:
        owner_id = uuid4()
        deployment = make_deployment(owner_id=owner_id, status=DeploymentStatus.DESTROYED)
        repository = FakeDeploymentRepository([deployment])
        queue = FakeJobQueue()
        use_case = RegeneratePassword(repository=repository, queue=queue)

        with pytest.raises(InvalidDeploymentStateException):
            await use_case.execute(deployment.id, owner_id)
        assert queue.enqueued == []
