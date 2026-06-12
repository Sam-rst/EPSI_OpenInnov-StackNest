"""Value object TemplateDeployability : deployabilite d'un template, vue chat."""

from dataclasses import dataclass

from app.catalog.domain.entities.template import Template
from app.catalog.domain.enums.engine_kind import EngineKind
from app.chat.domain.enums.blocked_reason import BlockedReason


@dataclass(frozen=True)
class TemplateDeployability:
    """Verdict de deployabilite d'un template, calcule pour le moteur de chat.

    Source de verite unique partagee par les deux couches anti-hallucination du
    chat : les outils de LECTURE (qui exposent `deployable`/`blocked_reason` au
    modele) et la GATE de validation des actions (qui refuse un deploiement non
    deployable). Evite de dupliquer la regle metier.

    Un template est deployable s'il utilise le moteur Docker ET porte
    `is_deployable=True`. Sinon `blocked_reason` precise la cause (motif honnete
    affiche/explique a l'utilisateur).
    """

    deployable: bool
    blocked_reason: BlockedReason | None

    @classmethod
    def from_template(cls, template: Template) -> "TemplateDeployability":
        """Calcule la deployabilite depuis l'entite catalogue (engine + flag)."""
        if template.engine is not EngineKind.DOCKER:
            return cls(deployable=False, blocked_reason=BlockedReason.TERRAFORM)
        if not template.is_deployable:
            return cls(deployable=False, blocked_reason=BlockedReason.RUNTIME)
        return cls(deployable=True, blocked_reason=None)
