"""Tests unitaires de la gate anti-hallucination de validation des arguments.

Verifie la 2e couche anti-hallucination (cf. design) : la gate valide qu'un
appel d'outil d'action reference des entites reelles (template existant, version
proposee, parametres conformes au schema, deploiement possede) AVANT de produire
une `ActionProposal` confirmable. Tout ecart leve une exception metier typee.
"""

from uuid import uuid4

import pytest

from app.catalog.domain.entities.template import Template
from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.param_type import ParamType
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

    async def test_deploy_param_secret_requis_n_est_pas_exige_ni_propose(self) -> None:
        # Un param de type `secret` (genere au provisioning par le worker) ne doit
        # ni etre exige a l'utilisateur, ni apparaitre dans la proposition.
        template = make_template(
            versions=["16"],
            params=[
                make_param(key="db_name", required=True),
                make_param(key="password", param_type=ParamType.SECRET, required=True),
            ],
        )
        gate = _gate(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={
                "template_id": str(template.id),
                "version": "16",
                "name": "db",
                "params": {"db_name": "app"},  # password requis absent : ne doit PAS lever
            },
        )

        proposal = await gate.validate(call, owner_id=uuid4())

        assert "password" not in proposal.args["params"]
        assert "password" not in proposal.recap["params"]
        assert proposal.args["params"] == {"db_name": "app"}

    async def test_deploy_strippe_un_param_secret_fourni_par_le_modele(self) -> None:
        # Si le modele fournit malgre tout un secret, on le retire (jamais propage).
        template = make_template(
            versions=["16"],
            params=[make_param(key="password", param_type=ParamType.SECRET, required=True)],
        )
        gate = _gate(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={
                "template_id": str(template.id),
                "version": "16",
                "name": "db",
                "params": {"password": "secret123"},
            },
        )

        proposal = await gate.validate(call, owner_id=uuid4())

        assert "password" not in proposal.args["params"]

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


class TestDeployabilityGuard:
    """La gate refuse un deploy ciblant un template non deployable, avec un
    message honnete (backstop chat avant le 409 de CreateDeployment)."""

    async def test_deploy_template_terraform_leve_invalid_args(self) -> None:
        template = make_template(engine=EngineKind.TERRAFORM, versions=["1"])
        gate = _gate(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={"template_id": str(template.id), "version": "1", "name": "x", "params": {}},
        )

        with pytest.raises(InvalidToolArgsException) as error:
            await gate.validate(call, owner_id=uuid4())
        assert "pas encore deployable" in error.value.message.lower()

    async def test_deploy_runtime_non_deployable_leve_invalid_args(self) -> None:
        template = make_template(engine=EngineKind.DOCKER, is_deployable=False, versions=["20"])
        gate = _gate(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={"template_id": str(template.id), "version": "20", "name": "x", "params": {}},
        )

        with pytest.raises(InvalidToolArgsException) as error:
            await gate.validate(call, owner_id=uuid4())
        assert "pas encore deployable" in error.value.message.lower()

    async def test_deploy_template_deployable_passe_sans_regression(self) -> None:
        template = make_template(engine=EngineKind.DOCKER, is_deployable=True, versions=["16"])
        gate = _gate(FakeCatalogReader([template]), FakeDeploymentRepository())
        call = ToolCall(
            name="deploy_template",
            args={"template_id": str(template.id), "version": "16", "name": "db", "params": {}},
        )

        proposal = await gate.validate(call, owner_id=uuid4())

        assert proposal.kind is ActionKind.DEPLOY


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


class TestComposeStackValidation:
    """La gate valide une proposition `compose_stack` : chaque service = template
    reel et deployable, structure validee par le StackValidator, secrets exclus."""

    @staticmethod
    def _two_templates() -> tuple[Template, Template]:
        db = make_template(slug="postgresql", name="PostgreSQL", versions=["16"])
        api = make_template(slug="node", name="Node", versions=["20"])
        return db, api

    async def test_composition_conforme_renvoie_une_proposition(self) -> None:
        db, api = self._two_templates()
        gate = _gate(FakeCatalogReader([db, api]), FakeDeploymentRepository())
        call = ToolCall(
            name="propose_stack",
            args={
                "name": "mon-app",
                "services": [
                    {"template_id": str(db.id), "alias": "db", "version": "16"},
                    {"template_id": str(api.id), "alias": "api", "version": "20"},
                ],
                "links": [
                    {
                        "from_alias": "api",
                        "to_alias": "db",
                        "var_mappings": {"DATABASE_HOST": "{to.alias}"},
                    }
                ],
            },
        )

        proposal = await gate.validate(call, owner_id=uuid4())

        assert proposal.kind is ActionKind.COMPOSE_STACK
        assert proposal.args["name"] == "mon-app"
        aliases = {service["alias"] for service in proposal.args["services"]}
        assert aliases == {"db", "api"}
        assert proposal.restatement.strip() != ""
        assert len(proposal.recap["services"]) == 2
        assert proposal.recap["links"][0]["from"] == "api"

    async def test_service_non_deployable_leve_invalid_args(self) -> None:
        terraform = make_template(slug="vm", engine=EngineKind.TERRAFORM, versions=["1"])
        gate = _gate(FakeCatalogReader([terraform]), FakeDeploymentRepository())
        call = ToolCall(
            name="propose_stack",
            args={
                "name": "x",
                "services": [{"template_id": str(terraform.id), "alias": "vm", "version": "1"}],
            },
        )

        with pytest.raises(InvalidToolArgsException) as error:
            await gate.validate(call, owner_id=uuid4())
        assert "pas encore deployable" in error.value.message.lower()

    async def test_template_inconnu_leve_unknown_template(self) -> None:
        gate = _gate(FakeCatalogReader([]), FakeDeploymentRepository())
        call = ToolCall(
            name="propose_stack",
            args={
                "name": "x",
                "services": [{"template_id": str(uuid4()), "alias": "db", "version": "16"}],
            },
        )

        with pytest.raises(UnknownTemplateException):
            await gate.validate(call, owner_id=uuid4())

    async def test_alias_duplique_leve_invalid_args(self) -> None:
        db, _ = self._two_templates()
        gate = _gate(FakeCatalogReader([db]), FakeDeploymentRepository())
        call = ToolCall(
            name="propose_stack",
            args={
                "name": "x",
                "services": [
                    {"template_id": str(db.id), "alias": "db", "version": "16"},
                    {"template_id": str(db.id), "alias": "db", "version": "16"},
                ],
            },
        )

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_lien_vers_alias_inexistant_leve_invalid_args(self) -> None:
        db, _ = self._two_templates()
        gate = _gate(FakeCatalogReader([db]), FakeDeploymentRepository())
        call = ToolCall(
            name="propose_stack",
            args={
                "name": "x",
                "services": [{"template_id": str(db.id), "alias": "db", "version": "16"}],
                "links": [{"from_alias": "db", "to_alias": "absent"}],
            },
        )

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_auto_lien_leve_invalid_args(self) -> None:
        db, _ = self._two_templates()
        gate = _gate(FakeCatalogReader([db]), FakeDeploymentRepository())
        call = ToolCall(
            name="propose_stack",
            args={
                "name": "x",
                "services": [{"template_id": str(db.id), "alias": "db", "version": "16"}],
                "links": [{"from_alias": "db", "to_alias": "db"}],
            },
        )

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_cycle_leve_invalid_args(self) -> None:
        db, api = self._two_templates()
        gate = _gate(FakeCatalogReader([db, api]), FakeDeploymentRepository())
        call = ToolCall(
            name="propose_stack",
            args={
                "name": "x",
                "services": [
                    {"template_id": str(db.id), "alias": "db", "version": "16"},
                    {"template_id": str(api.id), "alias": "api", "version": "20"},
                ],
                "links": [
                    {"from_alias": "db", "to_alias": "api"},
                    {"from_alias": "api", "to_alias": "db"},
                ],
            },
        )

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_aucun_service_leve_invalid_args(self) -> None:
        gate = _gate(FakeCatalogReader([]), FakeDeploymentRepository())
        call = ToolCall(name="propose_stack", args={"name": "x", "services": []})

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_nom_vide_leve_invalid_args(self) -> None:
        db, _ = self._two_templates()
        gate = _gate(FakeCatalogReader([db]), FakeDeploymentRepository())
        call = ToolCall(
            name="propose_stack",
            args={
                "name": "   ",
                "services": [{"template_id": str(db.id), "alias": "db", "version": "16"}],
            },
        )

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())

    async def test_param_secret_jamais_propage(self) -> None:
        db = make_template(
            slug="postgresql",
            versions=["16"],
            params=[
                make_param(key="db_name", required=True),
                make_param(key="password", param_type=ParamType.SECRET, required=True),
            ],
        )
        gate = _gate(FakeCatalogReader([db]), FakeDeploymentRepository())
        call = ToolCall(
            name="propose_stack",
            args={
                "name": "x",
                "services": [
                    {
                        "template_id": str(db.id),
                        "alias": "db",
                        "version": "16",
                        "params": {"db_name": "app", "password": "secret123"},
                    }
                ],
            },
        )

        proposal = await gate.validate(call, owner_id=uuid4())

        service_args = proposal.args["services"][0]
        assert "password" not in service_args["params"]
        assert service_args["params"] == {"db_name": "app"}

    async def test_version_par_defaut_si_absente(self) -> None:
        db = make_template(slug="postgresql", versions=["16", "15"])
        gate = _gate(FakeCatalogReader([db]), FakeDeploymentRepository())
        call = ToolCall(
            name="propose_stack",
            args={"name": "x", "services": [{"template_id": str(db.id), "alias": "db"}]},
        )

        proposal = await gate.validate(call, owner_id=uuid4())

        assert proposal.args["services"][0]["version"] == "16"

    async def test_args_valides_rejouables_par_la_gate(self) -> None:
        # Les args produits doivent etre re-validables tels quels (rechargement du fil).
        db, api = self._two_templates()
        gate = _gate(FakeCatalogReader([db, api]), FakeDeploymentRepository())
        call = ToolCall(
            name="propose_stack",
            args={
                "name": "mon-app",
                "services": [
                    {"template_id": str(db.id), "alias": "db", "version": "16"},
                    {"template_id": str(api.id), "alias": "api", "version": "20"},
                ],
                "links": [{"from_alias": "api", "to_alias": "db"}],
            },
        )

        first = await gate.validate(call, owner_id=uuid4())
        replayed = await gate.validate(
            ToolCall(name="propose_stack", args=first.args), owner_id=uuid4()
        )

        assert replayed.recap == first.recap


class TestUnknownTool:
    async def test_outil_d_action_inconnu_leve_invalid_args(self) -> None:
        gate = _gate(FakeCatalogReader([]), FakeDeploymentRepository())
        call = ToolCall(name="outil_hallucine", args={})

        with pytest.raises(InvalidToolArgsException):
            await gate.validate(call, owner_id=uuid4())
