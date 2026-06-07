"""Tests unitaires du use case GetDeployment (avec fake repository)."""

from uuid import uuid4

import pytest

from app.deployment.application.__tests__.fakes import (
    FakeDeploymentRepository,
    make_deployment,
)
from app.deployment.application.get_deployment import GetDeployment
from app.deployment.domain.exceptions.deployment_not_found import (
    DeploymentNotFoundException,
)


class TestGetDeployment:
    async def test_renvoie_le_deploiement_de_l_owner(self) -> None:
        owner_id = uuid4()
        deployment = make_deployment(owner_id=owner_id)
        repository = FakeDeploymentRepository([deployment])
        use_case = GetDeployment(repository)

        result = await use_case.execute(deployment.id, owner_id)

        assert result.id == deployment.id

    async def test_deploiement_absent_leve_404(self) -> None:
        repository = FakeDeploymentRepository([])
        use_case = GetDeployment(repository)

        with pytest.raises(DeploymentNotFoundException):
            await use_case.execute(uuid4(), uuid4())

    async def test_deploiement_d_un_autre_owner_leve_404(self) -> None:
        deployment = make_deployment(owner_id=uuid4())
        repository = FakeDeploymentRepository([deployment])
        use_case = GetDeployment(repository)

        with pytest.raises(DeploymentNotFoundException):
            await use_case.execute(deployment.id, uuid4())
