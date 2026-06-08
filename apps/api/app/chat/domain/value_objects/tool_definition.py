"""Value object ToolDefinition : description d'un outil expose au LLM."""

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ToolDefinition:
    """Definition d'un outil propose au modele pour le tool-calling contraint.

    Immutable : produit par la construction des outils derives du catalogue
    (vague 2) puis transmis au `LLMProvider`. Les adaptateurs traduisent cette
    definition agnostique vers le format propre a chaque fournisseur (functions
    OpenAI, tools Anthropic, ...).

    Guard clauses : nom et description non vides (le modele s'appuie dessus pour
    choisir et decrire l'outil). Le schema des parametres suit la convention
    JSON Schema ; un schema vide decrit un outil sans argument.

    - `name`          : identifiant de l'outil (ex. `deploy_template`).
    - `description`   : phrase decrivant a quoi sert l'outil (pour le modele).
    - `params_schema` : schema JSON des arguments attendus (objet imbriquable).
    """

    name: str
    description: str
    params_schema: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.name.strip():
            raise ValueError("ToolDefinition.name ne doit pas etre vide.")
        if not self.description.strip():
            raise ValueError("ToolDefinition.description ne doit pas etre vide.")
