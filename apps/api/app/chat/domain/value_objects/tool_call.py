"""Value object ToolCall : appel d'outil emis par le LLM (avant validation)."""

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ToolCall:
    """Appel d'outil tel que produit par le modele (nom + arguments bruts).

    Immutable : represente l'intention du LLM d'invoquer un outil, **avant** la
    gate anti-hallucination (vague 2) qui valide les arguments contre le
    catalogue. Les arguments sont donc potentiellement non conformes a ce stade.

    Guard clause : le nom de l'outil ne peut etre vide. Aucune validation des
    arguments ici — c'est le role explicite de la gate de la vague 2.

    - `name` : nom de l'outil invoque (ex. `deploy_template`).
    - `args` : arguments bruts proposes par le modele (cles/valeurs JSON).
    """

    name: str
    args: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.name.strip():
            raise ValueError("ToolCall.name ne doit pas etre vide.")
