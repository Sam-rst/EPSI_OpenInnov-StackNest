"""Tests unitaires de la gate anti-hallucination de validation des arguments.

Verifie la 2e couche anti-hallucination (cf. design) : la gate valide qu'un
appel d'outil d'action reference des entites reelles (template existant, version
proposee, parametres conformes au schema, deploiement possede) AVANT de produire
une `ActionProposal` confirmable. Tout ecart leve une exception metier typee.
"""

from uuid import uuid4

import pytest

from app.chat.application.__tests__.fakes import (
    FakeCatalogReader,
    make_param,
    make_template,
)
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.exceptions.invalid_tool_args import InvalidToolArgsException
from app.chat.domain.exceptions.unknown_template import UnknownTemplateException
from app.chat.domain.value_objects.tool_call import ToolCall
from app.chat.infrastructure.tools.action_args_gate import ActionArgsGate
from app.deployment.application.__tests__.fakes import (
    FakeDeploymentRepository,
    make_deployment,
)
from app.deployment.domain.enums.deployment_status import DeploymentStatus


def _gate(reader: FakeCatalogReader, deployments: FakeDeploymentRepository) -> ActionArgsGate:
    return ActionArgsGate(catalog=reader, deployments=deployments)


class TestDeployValidation:
    async def test_deploy_avec_arguments_conformes_renvoie_une_proposition(self) -> None:
        template = make_template(versions=["16", "15"], params=[make_param(key="db_name")])
        gate = _gate(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={
                "template_id": str(template.id),
                "version": "16",
                "name": "ma-base",
                "params": {"db_name": "app"},
            },
        )

        proposal = await gate.validate(call, owner_id=uuid4())

        assert proposal.kind is ActionKind.DEPLOY
        assert proposal.args["template_id"] == str(template.id)
        assert proposal.args["version"] == "16"
        assert proposal.args["params"] == {"db_name": "app"}
        assert proposal.restatement.strip() != ""
        assert proposal.recap["template"] == template.name

    async def test_deploy_template_inconnu_leve_unknown_template(self) -> None:
        gate = _gate(FakeCatalogReader([]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={"template_id": str(uuid4()), "version": "16", "name": "x", "params": {}},
        )

        with pytest.raises(UnknownTemplateException):
            await gate.validate(call, owner_id=uuid4())

    async def test_deploy_template_id_non_uuid_leve_invalid_args(self) -> None:
        gate = _gate(FakeCatalogReader([]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={"template_id": "pas-un-uuid", "version": "16", "name": "x", "params": {}},
        )

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_deploy_version_hors_catalogue_leve_invalid_args(self) -> None:
        template = make_template(versions=["16", "15"])
        gate = _gate(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={"template_id": str(template.id), "version": "99", "name": "x", "params": {}},
        )

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_deploy_param_inconnu_leve_invalid_args(self) -> None:
        template = make_template(versions=["16"], params=[make_param(key="db_name")])
        gate = _gate(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={
                "template_id": str(template.id),
                "version": "16",
                "name": "x",
                "params": {"param_hallucine": "valeur"},
            },
        )

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_deploy_param_requis_manquant_leve_invalid_args(self) -> None:
        template = make_template(versions=["16"], params=[make_param(key="db_name", required=True)])
        gate = _gate(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={"template_id": str(template.id), "version": "16", "name": "x", "params": {}},
        )

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_deploy_nom_vide_leve_invalid_args(self) -> None:
        template = make_template(versions=["16"])
        gate = _gate(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={"template_id": str(template.id), "version": "16", "name": "  ", "params": {}},
        )

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_deploy_version_par_defaut_si_absente(self) -> None:
        template = make_template(versions=["16", "15"])
        gate = _gate(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={"template_id": str(template.id), "name": "ma-base", "params": {}},
        )

        proposal = await gate.validate(call, owner_id=uuid4())

        assert proposal.args["version"] == "16"


class TestLifecycleValidation:
    async def test_stop_d_un_deploiement_possede_renvoie_une_proposition(self) -> None:
        owner = uuid4()
        deployment = make_deployment(owner_id=owner, status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        gate = _gate(FakeCatalogReader([]), repository)
        call = ToolCall(name="stop_deployment", args={"deployment_id": str(deployment.id)})

        proposal = await gate.validate(call, owner_id=owner)

        assert proposal.kind is ActionKind.STOP
        assert proposal.args["deployment_id"] == str(deployment.id)
        assert proposal.restatement.strip() != ""

    async def test_start_d_un_deploiement_possede_renvoie_une_proposition(self) -> None:
        owner = uuid4()
        deployment = make_deployment(owner_id=owner, status=DeploymentStatus.STOPPED)
        gate = _gate(FakeCatalogReader([]), FakeDeploymentRepository([deployment]))
        call = ToolCall(name="start_deployment", args={"deployment_id": str(deployment.id)})

        proposal = await gate.validate(call, owner_id=owner)

        assert proposal.kind is ActionKind.START

    async def test_regenerate_d_un_deploiement_possede_renvoie_une_proposition(self) -> None:
        owner = uuid4()
        deployment = make_deployment(owner_id=owner, status=DeploymentStatus.RUNNING)
        gate = _gate(FakeCatalogReader([]), FakeDeploymentRepository([deployment]))
        call = ToolCall(name="regenerate_password", args={"deployment_id": str(deployment.id)})

        proposal = await gate.validate(call, owner_id=owner)

        assert proposal.kind is ActionKind.REGENERATE

    async def test_stop_deploiement_inconnu_leve_invalid_args(self) -> None:
        gate = _gate(FakeCatalogReader([]), FakeDeploymentRepository())
        call = ToolCall(name="stop_deployment", args={"deployment_id": str(uuid4())})

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_stop_deploiement_d_autrui_leve_invalid_args(self) -> None:
        deployment = make_deployment(owner_id=uuid4(), status=DeploymentStatus.RUNNING)
        gate = _gate(FakeCatalogReader([]), FakeDeploymentRepository([deployment]))
        call = ToolCall(name="stop_deployment", args={"deployment_id": str(deployment.id)})

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_stop_deployment_id_non_uuid_leve_invalid_args(self) -> None:
        gate = _gate(FakeCatalogReader([]), FakeDeploymentRepository())
        call = ToolCall(name="stop_deployment", args={"deployment_id": "pas-un-uuid"})

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())


class TestUnknownTool:
    async def test_outil_d_action_inconnu_leve_invalid_args(self) -> None:
        gate = _gate(FakeCatalogReader([]), FakeDeploymentRepository())
        call = ToolCall(name="outil_hallucine", args={})

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())
