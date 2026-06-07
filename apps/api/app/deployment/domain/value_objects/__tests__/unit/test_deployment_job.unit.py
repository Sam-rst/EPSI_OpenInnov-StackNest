"""Tests unitaires du value object DeploymentJob (job enfile vers le worker)."""

from uuid import uuid4

import pytest

from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.value_objects.deployment_job import DeploymentJob


class TestDeploymentJobValide:
    def test_construction_nominale(self) -> None:
        deployment_id = uuid4()
        job = DeploymentJob(kind=JobKind.PROVISION, deployment_id=deployment_id)

        assert job.kind is JobKind.PROVISION
        assert job.deployment_id == deployment_id

    def test_est_immutable(self) -> None:
        job = DeploymentJob(kind=JobKind.STOP, deployment_id=uuid4())

        with pytest.raises(Exception):  # noqa: B017 (FrozenInstanceError)
            job.kind = JobKind.START  # type: ignore[misc]
