"""Construction des ToolDefinition exposes au LLM a partir du catalogue reel.

1re couche anti-hallucination (cf. design) : la boite a outils est FERMEE. Le
modele ne dispose que de 7 outils (3 de lecture + 4 d'action) et l'outil
`deploy_template` enumere dynamiquement les `template_id` et versions REELS du
catalogue dans son schema JSON. Le modele ne peut donc proposer que des entites
existantes ; la gate (`ActionArgsGate`) revalide neanmoins a la confirmation.
"""

from typing import Any

from app.catalog.domain.entities.template import Template
from app.chat.domain.interfaces.catalog_reader import CatalogReader
from app.chat.domain.value_objects.tool_definition import ToolDefinition
from app.chat.infrastructure.tools.tool_names import ToolName


class ToolCatalogBuilder:
    """Derive la liste fermee des `ToolDefinition` a partir du catalogue.

    Lit le catalogue une fois par construction pour enumerer les templates et
    leurs versions dans le schema de `deploy_template`. Les outils de cycle de
    vie ne contraignent que `deployment_id` (valide a la confirmation par la
    gate, car la liste des deploiements de l'utilisateur est dynamique).
    """

    def __init__(self, catalog: CatalogReader) -> None:
        self._catalog = catalog

    async def build(self) -> list[ToolDefinition]:
        """Construit les 7 outils exposes au modele (lecture + action)."""
        templates = await self._catalog.list_templates()
        return [
            self._list_catalog(),
            self._get_template(),
            self._list_my_deployments(),
            self._deploy_template(templates),
            self._stop_deployment(),
            self._start_deployment(),
            self._regenerate_password(),
        ]

    @staticmethod
    def _list_catalog() -> ToolDefinition:
        return ToolDefinition(
            name=ToolName.LIST_CATALOG.value,
            description=(
                "Liste les templates disponibles dans le catalogue StackNest "
                "(nom, categorie, versions). A appeler pour repondre a « que "
                "puis-je deployer ? »."
            ),
            params_schema={"type": "object", "properties": {}, "required": []},
        )

    @staticmethod
    def _get_template() -> ToolDefinition:
        return ToolDefinition(
            name=ToolName.GET_TEMPLATE.value,
            description=(
                "Renvoie le detail d'un template (versions, parametres de "
                "configuration) a partir de son identifiant."
            ),
            params_schema={
                "type": "object",
                "properties": {
                    "template_id": {"type": "string", "description": "Identifiant du template."}
                },
                "required": ["template_id"],
            },
        )

    @staticmethod
    def _list_my_deployments() -> ToolDefinition:
        return ToolDefinition(
            name=ToolName.LIST_MY_DEPLOYMENTS.value,
            description=(
                "Liste les deploiements de l'utilisateur courant (nom, statut, "
                "identifiant). A appeler avant toute action sur un deploiement "
                "existant (stop / start / regeneration de mot de passe)."
            ),
            params_schema={"type": "object", "properties": {}, "required": []},
        )

    @staticmethod
    def _deploy_template(templates: list[Template]) -> ToolDefinition:
        template_ids = [str(template.id) for template in templates]
        versions = sorted(
            {version.version for template in templates for version in template.versions}
        )
        return ToolDefinition(
            name=ToolName.DEPLOY_TEMPLATE.value,
            description=(
                "Propose le deploiement d'un template du catalogue. Ne s'execute "
                "JAMAIS directement : produit une proposition que l'utilisateur "
                "confirme. N'utiliser que des identifiants issus du catalogue."
            ),
            params_schema={
                "type": "object",
                "properties": {
                    "template_id": {
                        "type": "string",
                        "description": "Identifiant du template a deployer.",
                        "enum": template_ids,
                    },
                    "version": {
                        "type": "string",
                        "description": "Version a deployer (defaut = version par defaut).",
                        "enum": versions,
                    },
                    "name": {
                        "type": "string",
                        "description": "Nom donne au deploiement.",
                    },
                    "params": {
                        "type": "object",
                        "description": "Valeurs des parametres de configuration du template.",
                    },
                },
                "required": ["template_id", "name"],
            },
        )

    @classmethod
    def _stop_deployment(cls) -> ToolDefinition:
        return cls._lifecycle_tool(
            ToolName.STOP_DEPLOYMENT,
            "Propose l'arret d'un deploiement existant (confirmation requise).",
        )

    @classmethod
    def _start_deployment(cls) -> ToolDefinition:
        return cls._lifecycle_tool(
            ToolName.START_DEPLOYMENT,
            "Propose le redemarrage d'un deploiement arrete (confirmation requise).",
        )

    @classmethod
    def _regenerate_password(cls) -> ToolDefinition:
        return cls._lifecycle_tool(
            ToolName.REGENERATE_PASSWORD,
            "Propose la regeneration du mot de passe d'un deploiement (confirmation requise).",
        )

    @staticmethod
    def _lifecycle_tool(name: ToolName, description: str) -> ToolDefinition:
        schema: dict[str, Any] = {
            "type": "object",
            "properties": {
                "deployment_id": {
                    "type": "string",
                    "description": "Identifiant du deploiement cible.",
                }
            },
            "required": ["deployment_id"],
        }
        return ToolDefinition(name=name.value, description=description, params_schema=schema)
