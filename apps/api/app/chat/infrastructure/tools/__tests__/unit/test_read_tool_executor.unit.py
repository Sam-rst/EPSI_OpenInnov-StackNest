"""Tests unitaires de l'execution des outils de lecture du chat.

Les outils de lecture (list_catalog / get_template / list_my_deployments)
s'executent immediatement (sans confirmation) : ils renvoient un resultat
serialisable, reinjecte dans la conversation comme message `tool`. Isolation
owner pour `list_my_deployments`. Un identifiant inconnu n'explose pas : il
renvoie un resultat exploitable par le modele.
"""

from uuid import uuid4

import pytest

from app.chat.application.__tests__.fakes import FakeCatalogReader, make_template
from app.chat.domain.exceptions.invalid_tool_args import InvalidToolArgsException
from app.chat.domain.value_objects.tool_call import ToolCall
from app.chat.infrastructure.tools.read_tool_executor import ReadToolExecutor
from app.chat.infrastructure.tools.tool_names import ToolName
from app.deployment.application.__tests__.fakes import (
    FakeDeploymentRepository,
    make_deployment,
)


def _executor(reader: FakeCatalogReader, deployments: FakeDeploymentRepository) -> ReadToolExecutor:
    return ReadToolExecutor(catalog=reader, deployments=deployments)


class TestListCatalog:
    async def test_renvoie_les_templates_du_catalogue(self) -> None:
        template = make_template(name="PostgreSQL")
        executor = _executor(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(name=ToolName.LIST_CATALOG.value, args={})

        result = await executor.execute(call, owner_id=uuid4())

        assert any(item["name"] == "PostgreSQL" for item in result["templates"])


class TestGetTemplate:
    async def test_renvoie_le_detail_avec_versions_et_params(self) -> None:
        template = make_template(versions=["16", "15"])
        executor = _executor(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(name=ToolName.GET_TEMPLATE.value, args={"template_id": str(template.id)})

        result = await executor.execute(call, owner_id=uuid4())

        assert result["template"]["id"] == str(template.id)
        assert "16" in [v["version"] for v in result["template"]["versions"]]

    async def test_template_inconnu_renvoie_un_resultat_non_trouve(self) -> None:
        executor = _executor(FakeCatalogReader([]), FakeDeploymentRepository())
        call = ToolCall(name=ToolName.GET_TEMPLATE.value, args={"template_id": str(uuid4())})

        result = await executor.execute(call, owner_id=uuid4())

        assert result["template"] is None

    async def test_template_id_non_uuid_leve_invalid_args(self) -> None:
        executor = _executor(FakeCatalogReader([]), FakeDeploymentRepository())
        call = ToolCall(name=ToolName.GET_TEMPLATE.value, args={"template_id": "pas-uuid"})

        with pytest.raises(InvalidToolArgsException):
            await executor.execute(call, owner_id=uuid4())


class TestListMyDeployments:
    async def test_n_renvoie_que_les_deploiements_de_l_owner(self) -> None:
        owner = uuid4()
        mine = make_deployment(owner_id=owner, name="a-moi")
        other = make_deployment(owner_id=uuid4(), name="pas-a-moi")
        executor = _executor(FakeCatalogReader([]), FakeDeploymentRepository([mine, other]))
        call = ToolCall(name=ToolName.LIST_MY_DEPLOYMENTS.value, args={})

        result = await executor.execute(call, owner_id=owner)

        names = [item["name"] for item in result["deployments"]]
        assert names == ["a-moi"]

    async def test_le_secret_n_apparait_jamais_dans_le_resultat(self) -> None:
        owner = uuid4()
        deployment = make_deployment(owner_id=owner)
        executor = _executor(FakeCatalogReader([]), FakeDeploymentRepository([deployment]))
        call = ToolCall(name=ToolName.LIST_MY_DEPLOYMENTS.value, args={})

        result = await executor.execute(call, owner_id=owner)

        assert "secret" not in result["deployments"][0]
        assert "password" not in result["deployments"][0]


class TestUnknownReadTool:
    async def test_outil_non_lecture_leve_invalid_args(self) -> None:
        executor = _executor(FakeCatalogReader([]), FakeDeploymentRepository())
        call = ToolCall(name=ToolName.DEPLOY_TEMPLATE.value, args={})

        with pytest.raises(InvalidToolArgsException):
            await executor.execute(call, owner_id=uuid4())
