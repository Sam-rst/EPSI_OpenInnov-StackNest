"""Tests unitaires du use case ListDeployments (avec fake repository)."""

from uuid import uuid4

from app.deployment.application.__tests__.fakes import (
    FakeDeploymentRepository,
    make_deployment,
)
from app.deployment.application.list_deployments import ListDeployments


class TestListDeployments:
    async def test_renvoie_les_deploiements_de_l_owner(self) -> None:
        owner_id = uuid4()
        mine = make_deployment(owner_id=owner_id)
        other = make_deployment(owner_id=uuid4())
        repository = FakeDeploymentRepository([mine, other])
        use_case = ListDeployments(repository)

        result = await use_case.execute(owner_id)

        assert [d.id for d in result] == [mine.id]

    async def test_liste_vide_si_aucun_deploiement(self) -> None:
        repository = FakeDeploymentRepository([])
        use_case = ListDeployments(repository)

        result = await use_case.execute(uuid4())

        assert result == []
