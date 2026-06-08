"""Value object ActionProposal : action validee, reformulee, a confirmer."""

from dataclasses import dataclass, field
from typing import Any

from app.chat.domain.enums.action_kind import ActionKind


@dataclass(frozen=True)
class ActionProposal:
    """Proposition d'action presentee a l'utilisateur avant execution.

    Immutable : produite par le use case `SendMessage` (vague 2) une fois
    l'appel d'outil du LLM **valide** contre le catalogue (gate
    anti-hallucination). Sert de contenu a l'`ActionCard` du front : l'utilisateur
    voit exactement ce qui va tourner, puis confirme ou rejette.

    La `restatement` (reformulation explicite de l'intention par l'IA) est la
    4e couche anti-hallucination du design : elle ne peut jamais etre vide.

    - `kind`        : nature de l'action (deploy / stop / start / regenerate).
    - `args`        : arguments **valides** (template_id, version, params, ...).
    - `restatement` : reformulation humaine de l'intention (jamais vide).
    - `recap`       : recapitulatif structure affiche dans la carte (template,
      image figee, params, quotas).
    """

    kind: ActionKind
    args: dict[str, Any]
    restatement: str
    recap: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.restatement.strip():
            raise ValueError("ActionProposal.restatement ne doit pas etre vide.")
