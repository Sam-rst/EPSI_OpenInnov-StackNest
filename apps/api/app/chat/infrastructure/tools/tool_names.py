"""Noms canoniques des outils exposes au LLM (boite a outils fermee).

Source de verite unique partagee par la construction des `ToolDefinition`
(`ToolCatalogBuilder`), la gate de validation (`ActionArgsGate`) et l'execution
des outils de lecture (`ReadToolExecutor`). Centraliser ces noms garantit que le
modele, le validateur et l'executeur parlent le meme vocabulaire (1re couche
anti-hallucination : la boite a outils est fermee).
"""

from enum import StrEnum

from app.chat.domain.enums.action_kind import ActionKind


class ToolName(StrEnum):
    """Identifiants des outils proposes au modele.

    Outils de lecture (executes immediatement, sans confirmation) et outils
    d'action (produisent une `ActionProposal` confirmable, jamais executes
    directement).
    """

    # Lecture
    LIST_CATALOG = "list_catalog"
    GET_TEMPLATE = "get_template"
    LIST_MY_DEPLOYMENTS = "list_my_deployments"

    # Action
    DEPLOY_TEMPLATE = "deploy_template"
    STOP_DEPLOYMENT = "stop_deployment"
    START_DEPLOYMENT = "start_deployment"
    REGENERATE_PASSWORD = "regenerate_password"


# Correspondance outil d'action -> nature d'action (ActionKind), utilisee par la
# gate pour typer la proposition produite.
ACTION_TOOL_KINDS: dict[ToolName, ActionKind] = {
    ToolName.DEPLOY_TEMPLATE: ActionKind.DEPLOY,
    ToolName.STOP_DEPLOYMENT: ActionKind.STOP,
    ToolName.START_DEPLOYMENT: ActionKind.START,
    ToolName.REGENERATE_PASSWORD: ActionKind.REGENERATE,
}

# Outils de lecture (executes immediatement par le moteur).
READ_TOOLS: frozenset[ToolName] = frozenset(
    {ToolName.LIST_CATALOG, ToolName.GET_TEMPLATE, ToolName.LIST_MY_DEPLOYMENTS}
)
