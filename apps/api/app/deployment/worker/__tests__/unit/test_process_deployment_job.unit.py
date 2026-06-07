"""Tests unitaires de la fonction worker process_deployment_job (avec ctx fake)."""

from typing import Any
from uuid import uuid4

from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.value_objects.deployment_job import DeploymentJob
from app.worker_main import process_deployment_job


class _RecordingExecutor:
    """Capture le job execute pour assertion (remplace l'executor reel en ctx)."""

    def __init__(self) -> None:
        self.jobs: list[DeploymentJob] = []

    async def __call__(self, job: DeploymentJob) -> None:
        self.jobs.append(job)


class TestProcessDeploymentJob:
    async def test_deserialise_le_job_et_delegue_a_l_executor(self) -> None:
        executor = _RecordingExecutor()
        ctx: dict[str, Any] = {"execute_job": executor}
        deployment_id = uuid4()

        await process_deployment_job(
            ctx, kind=JobKind.PROVISION.value, deployment_id=str(deployment_id)
        )

        assert len(executor.jobs) == 1
        assert executor.jobs[0].kind is JobKind.PROVISION
        assert executor.jobs[0].deployment_id == deployment_id

    async def test_propage_le_type_de_job(self) -> None:
        executor = _RecordingExecutor()
        ctx: dict[str, Any] = {"execute_job": executor}

        await process_deployment_job(ctx, kind=JobKind.DESTROY.value, deployment_id=str(uuid4()))

        assert executor.jobs[0].kind is JobKind.DESTROY
