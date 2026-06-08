"""Gate anti-hallucination : valide les arguments d'un appel d'outil d'action.

2e couche anti-hallucination (cf. design) : avant de produire une
`ActionProposal` confirmable, la gate verifie que l'appel d'outil emis par le
modele reference des entites REELLES :

- un `template_id` present dans le catalogue (sinon `UnknownTemplateException`) ;
- une `version` proposee par ce template ;
- des `params` dont les cles existent dans le schema du template et dont les
  parametres requis sont fournis ;
- un `deployment_id` appartenant a l'utilisateur courant.

Tout ecart leve `InvalidToolArgsException`. La gate produit aussi la
reformulation (`restatement`, 4e couche) et le recapitulatif affiches dans la
carte d'action.
"""

from typing import Any
from uuid import UUID

from app.catalog.domain.entities.template import Template
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.exceptions.invalid_tool_args import InvalidToolArgsException
from app.chat.domain.exceptions.unknown_template import UnknownTemplateException
from app.chat.domain.interfaces.catalog_reader import CatalogReader
from app.chat.domain.value_objects.action_proposal import ActionProposal
from app.chat.domain.value_objects.tool_call import ToolCall
from app.chat.infrastructure.tools.tool_names import ACTION_TOOL_KINDS, ToolName
from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository


class ActionArgsGate:
    """Valide un `ToolCall` d'action contre le catalogue et les deploiements.

    Lecture seule : la gate n'execute rien, elle decide si une action est
    proposable et construit la `ActionProposal` correspondante. Les acces aux
    deploiements sont isoles par proprietaire (un deploiement d'autrui est traite
    comme inexistant).
    """

    def __init__(self, *, catalog: CatalogReader, deployments: DeploymentRepository) -> None:
        self._catalog = catalog
        self._deployments = deployments

    async def validate(self, call: ToolCall, *, owner_id: UUID) -> ActionProposal:
        """Valide l'appel d'outil et renvoie une `ActionProposal` confirmable."""
        tool = self._resolve_action_tool(call.name)
        if tool is ToolName.DEPLOY_TEMPLATE:
            return await self._validate_deploy(call.args, owner_id=owner_id)
        return await self._validate_lifecycle(tool, call.args, owner_id=owner_id)

    @staticmethod
    def _resolve_action_tool(name: str) -> ToolName:
        try:
            tool = ToolName(name)
        except ValueError as error:
            raise InvalidToolArgsException(f"Outil inconnu : {name!r}.") from error
        if tool not in ACTION_TOOL_KINDS:
            raise InvalidToolArgsException(f"L'outil {name!r} n'est pas une action.")
        return tool

    async def _validate_deploy(self, args: dict[str, Any], *, owner_id: UUID) -> ActionProposal:
        template = await self._load_template(args.get("template_id"))
        version = self._resolve_version(template, args.get("version"))
        name = self._require_name(args.get("name"))
        params = self._validate_params(template, args.get("params") or {})
        return ActionProposal(
            kind=ActionKind.DEPLOY,
            args={
                "template_id": str(template.id),
                "version": version,
                "name": name,
                "params": params,
            },
            restatement=(f"Deployer {template.name} (version {version}) sous le nom « {name} »."),
            recap={
                "template": template.name,
                "version": version,
                "name": name,
                "params": params,
            },
        )

    async def _validate_lifecycle(
        self, tool: ToolName, args: dict[str, Any], *, owner_id: UUID
    ) -> ActionProposal:
        deployment = await self._load_owned_deployment(args.get("deployment_id"), owner_id)
        kind = ACTION_TOOL_KINDS[tool]
        return ActionProposal(
            kind=kind,
            args={"deployment_id": str(deployment.id)},
            restatement=self._lifecycle_restatement(kind, deployment),
            recap={"deployment": deployment.name, "status": deployment.status.value},
        )

    async def _load_template(self, raw_id: Any) -> Template:
        template_id = self._parse_uuid(raw_id, field="template_id")
        template = await self._catalog.get_template(template_id)
        if template is None:
            raise UnknownTemplateException()
        return template

    async def _load_owned_deployment(self, raw_id: Any, owner_id: UUID) -> Deployment:
        deployment_id = self._parse_uuid(raw_id, field="deployment_id")
        deployment = await self._deployments.get_by_id(deployment_id)
        if deployment is None or deployment.owner_id != owner_id:
            raise InvalidToolArgsException("Deploiement introuvable ou non possede.")
        return deployment

    @staticmethod
    def _parse_uuid(raw_id: Any, *, field: str) -> UUID:
        if not isinstance(raw_id, str):
            raise InvalidToolArgsException(f"Argument {field!r} manquant ou invalide.")
        try:
            return UUID(raw_id)
        except ValueError as error:
            raise InvalidToolArgsException(f"Argument {field!r} n'est pas un UUID.") from error

    @staticmethod
    def _resolve_version(template: Template, raw_version: Any) -> str:
        available = {candidate.version for candidate in template.versions}
        if raw_version is None:
            default = next(
                (v.version for v in template.versions if v.is_default),
                next(iter(available), None),
            )
            if default is None:
                raise InvalidToolArgsException("Aucune version disponible pour ce template.")
            return default
        if not isinstance(raw_version, str) or raw_version not in available:
            raise InvalidToolArgsException(f"Version {raw_version!r} absente du template.")
        return raw_version

    @staticmethod
    def _require_name(raw_name: Any) -> str:
        if not isinstance(raw_name, str) or not raw_name.strip():
            raise InvalidToolArgsException("Le nom du deploiement est requis.")
        return raw_name.strip()

    @staticmethod
    def _validate_params(template: Template, raw_params: Any) -> dict[str, Any]:
        if not isinstance(raw_params, dict):
            raise InvalidToolArgsException("Les parametres doivent etre un objet.")
        allowed = {param.key for param in template.params}
        unknown = set(raw_params) - allowed
        if unknown:
            raise InvalidToolArgsException(f"Parametres inconnus : {sorted(unknown)}.")
        missing = {
            param.key for param in template.params if param.required and param.key not in raw_params
        }
        if missing:
            raise InvalidToolArgsException(f"Parametres requis manquants : {sorted(missing)}.")
        return dict(raw_params)

    @staticmethod
    def _lifecycle_restatement(kind: ActionKind, deployment: Deployment) -> str:
        verbs = {
            ActionKind.STOP: "Arreter",
            ActionKind.START: "Redemarrer",
            ActionKind.REGENERATE: "Regenerer le mot de passe de",
        }
        return f"{verbs[kind]} le deploiement « {deployment.name} »."
