"""Execution des outils de lecture du chat (resultat reinjecte au modele).

Les outils de lecture (list_catalog / get_template / list_my_deployments) sont
sans effet de bord : ils s'executent immediatement (sans confirmation) et
renvoient un dict serialisable, reinjecte dans la conversation comme message
`tool` pour que le modele formule sa reponse. `list_my_deployments` est isole
par proprietaire et n'expose JAMAIS de secret (le secret ne transite que sur le
flux SSE de deploiement, jamais cote LLM, cf. design).
"""

from typing import Any
from uuid import UUID

from app.catalog.domain.entities.template import Template
from app.chat.domain.exceptions.invalid_tool_args import InvalidToolArgsException
from app.chat.domain.interfaces.catalog_reader import CatalogReader
from app.chat.domain.value_objects.tool_call import ToolCall
from app.chat.infrastructure.tools.tool_names import ToolName
from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository


class ReadToolExecutor:
    """Execute les outils de lecture et renvoie un resultat serialisable.

    Lecture seule : aucun effet de bord, aucune confirmation. Un identifiant
    inconnu (get_template) ne leve pas d'exception — il renvoie `None` pour que
    le modele puisse reformuler. Un nom d'outil hors lecture leve
    `InvalidToolArgsException`.
    """

    def __init__(self, *, catalog: CatalogReader, deployments: DeploymentRepository) -> None:
        self._catalog = catalog
        self._deployments = deployments

    async def execute(self, call: ToolCall, *, owner_id: UUID) -> dict[str, Any]:
        """Execute l'outil de lecture `call` et renvoie son resultat."""
        tool = self._resolve_read_tool(call.name)
        if tool is ToolName.LIST_CATALOG:
            return await self._list_catalog()
        if tool is ToolName.GET_TEMPLATE:
            return await self._get_template(call.args.get("template_id"))
        return await self._list_my_deployments(owner_id)

    @staticmethod
    def _resolve_read_tool(name: str) -> ToolName:
        try:
            tool = ToolName(name)
        except ValueError as error:
            raise InvalidToolArgsException(f"Outil inconnu : {name!r}.") from error
        read_tools = {
            ToolName.LIST_CATALOG,
            ToolName.GET_TEMPLATE,
            ToolName.LIST_MY_DEPLOYMENTS,
        }
        if tool not in read_tools:
            raise InvalidToolArgsException(f"L'outil {name!r} n'est pas un outil de lecture.")
        return tool

    async def _list_catalog(self) -> dict[str, Any]:
        templates = await self._catalog.list_templates()
        return {"templates": [self._template_summary(template) for template in templates]}

    async def _get_template(self, raw_id: Any) -> dict[str, Any]:
        template_id = self._parse_uuid(raw_id)
        template = await self._catalog.get_template(template_id)
        return {"template": self._template_detail(template) if template else None}

    async def _list_my_deployments(self, owner_id: UUID) -> dict[str, Any]:
        deployments = await self._deployments.list_by_owner(owner_id)
        return {"deployments": [self._deployment_summary(d) for d in deployments]}

    @staticmethod
    def _parse_uuid(raw_id: Any) -> UUID:
        if not isinstance(raw_id, str):
            raise InvalidToolArgsException("Argument 'template_id' manquant ou invalide.")
        try:
            return UUID(raw_id)
        except ValueError as error:
            raise InvalidToolArgsException("Argument 'template_id' n'est pas un UUID.") from error

    @staticmethod
    def _template_summary(template: Template) -> dict[str, Any]:
        return {
            "id": str(template.id),
            "slug": str(template.slug),
            "name": template.name,
            "category": template.category.value,
            "engine": template.engine.value,
            "popular": template.popular,
        }

    @classmethod
    def _template_detail(cls, template: Template) -> dict[str, Any]:
        summary = cls._template_summary(template)
        summary["description"] = template.description
        summary["versions"] = [
            {"version": v.version, "is_default": v.is_default, "is_lts": v.is_lts}
            for v in template.versions
        ]
        summary["params"] = [
            {
                "key": param.key,
                "label": param.label,
                "type": param.type.value,
                "required": param.required,
            }
            for param in template.params
        ]
        return summary

    @staticmethod
    def _deployment_summary(deployment: Deployment) -> dict[str, Any]:
        return {
            "id": str(deployment.id),
            "name": deployment.name,
            "status": deployment.status.value,
            "template_version": deployment.template_version,
        }
