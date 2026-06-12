"""Construction des ToolDefinition exposes au LLM a partir du catalogue reel.

1re couche anti-hallucination (cf. design) : la boite a outils est FERMEE. Le
modele ne dispose que de 8 outils (3 de lecture + 5 d'action) et les outils
`deploy_template` / `propose_stack` enumerent dynamiquement les `template_id` et
versions REELS du catalogue dans leur schema JSON (propose_stack restreint aux
templates DEPLOYABLES). Le modele ne peut donc proposer que des entites
existantes ; la gate (`ActionArgsGate`) revalide neanmoins a la confirmation.
"""

from typing import Any

from app.catalog.domain.entities.template import Template
from app.chat.domain.interfaces.catalog_reader import CatalogReader
from app.chat.domain.value_objects.template_deployability import TemplateDeployability
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
        """Construit les outils exposes au modele (lecture + action)."""
        templates = await self._catalog.list_templates()
        deployable = [
            template
            for template in templates
            if TemplateDeployability.from_template(template).deployable
        ]
        return [
            self._list_catalog(),
            self._get_template(),
            self._list_my_deployments(),
            self._deploy_template(templates),
            self._stop_deployment(),
            self._start_deployment(),
            self._regenerate_password(),
            self._propose_stack(deployable),
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

    @staticmethod
    def _propose_stack(deployable: list[Template]) -> ToolDefinition:
        template_ids = [str(template.id) for template in deployable]
        versions = sorted(
            {version.version for template in deployable for version in template.versions}
        )
        return ToolDefinition(
            name=ToolName.PROPOSE_STACK.value,
            description=(
                "Propose de composer une STACK multi-services (plusieurs templates "
                "cables ensemble : ex. une API reliee a une base et un cache), "
                "provisionnee en une fois. A privilegier quand l'utilisateur veut "
                "plusieurs services qui communiquent ; pour un service unique, "
                "utilise deploy_template. Ne s'execute JAMAIS directement : produit "
                "une proposition que l'utilisateur confirme.\n"
                "Chaque service porte un `alias` (nom unique, court, ex. `db`, `api`, "
                "`cache`) qui sert d'hote reseau interne entre services.\n"
                "Les `links` cablent un service consommateur (`from_alias`) a un "
                "service fournisseur (`to_alias`) via `var_mappings` : un dictionnaire "
                "{ VARIABLE_ENV : expression } ou la VALEUR est une expression "
                "referencant le fournisseur, parmi : `{to.alias}` (hote/nom DNS "
                "interne), `{to.port}` (port interne), `{to.username}`, `{to.db_name}`, "
                "`{to.secret}` (mot de passe genere). Exemple : pour brancher une API "
                "sur une base d'alias `db`, "
                '`var_mappings = {"DATABASE_HOST": "{to.alias}", '
                '"DATABASE_PORT": "{to.port}", "DATABASE_PASSWORD": "{to.secret}"}`. '
                "N'utilise QUE des identifiants issus du catalogue (deployables) et ne "
                "demande JAMAIS de mot de passe : les secrets sont generes "
                "automatiquement."
            ),
            params_schema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Nom donne a la stack.",
                    },
                    "services": {
                        "type": "array",
                        "description": "Services composant la stack (au moins un).",
                        "items": {
                            "type": "object",
                            "properties": {
                                "template_id": {
                                    "type": "string",
                                    "description": "Identifiant du template du service.",
                                    "enum": template_ids,
                                },
                                "alias": {
                                    "type": "string",
                                    "description": (
                                        "Nom unique du service dans la stack (hote interne)."
                                    ),
                                },
                                "version": {
                                    "type": "string",
                                    "description": "Version (defaut = version par defaut).",
                                    "enum": versions,
                                },
                                "params": {
                                    "type": "object",
                                    "description": "Valeurs des parametres non secrets.",
                                },
                            },
                            "required": ["template_id", "alias"],
                        },
                    },
                    "links": {
                        "type": "array",
                        "description": "Liens diriges entre services (cablage par alias).",
                        "items": {
                            "type": "object",
                            "properties": {
                                "from_alias": {
                                    "type": "string",
                                    "description": "Alias du service consommateur.",
                                },
                                "to_alias": {
                                    "type": "string",
                                    "description": "Alias du service fournisseur.",
                                },
                                "var_mappings": {
                                    "type": "object",
                                    "description": (
                                        "{ VARIABLE_ENV : expression } ; expressions "
                                        "`{to.alias}` / `{to.port}` / `{to.username}` / "
                                        "`{to.db_name}` / `{to.secret}`."
                                    ),
                                },
                            },
                            "required": ["from_alias", "to_alias"],
                        },
                    },
                },
                "required": ["name", "services"],
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
