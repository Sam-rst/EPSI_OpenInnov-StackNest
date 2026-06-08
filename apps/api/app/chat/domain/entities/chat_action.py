"""Entite de domaine ChatAction : trace auditable d'une action de chat."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from uuid import UUID

from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.action_status import ActionStatus


@dataclass
class ChatAction:
    """Action proposee par l'IA puis confirmee / rejetee / executee.

    Entite mutable identifiee par `id` : trace auditable du cycle d'une action
    (proposed -> confirmed -> executed | failed | rejected). Rattachee a la
    `Conversation` et au `Message` assistant qui l'a declenchee. Une fois
    deleguee au use case de deploiement, `deployment_id` reference la ressource
    creee.

    `deployment_id` est porte en `str` (id de deploiement opaque cote domaine) ;
    la persistance le materialise en FK UUID vers `deployments`. None tant
    qu'aucune ressource n'a ete provisionnee.

    - `conversation_id` : fil auquel appartient l'action.
    - `message_id`      : message assistant ayant emis la proposition.
    - `kind`            : nature de l'action (deploy / stop / start / regenerate).
    - `args`            : arguments valides de l'action (template_id, version...).
    - `status`          : etat dans le cycle de vie de l'action.
    - `deployment_id`   : ressource creee une fois deleguee (None avant).
    """

    id: UUID
    conversation_id: UUID
    message_id: UUID
    kind: ActionKind
    status: ActionStatus
    args: dict[str, Any] = field(default_factory=dict)
    deployment_id: str | None = None
    created_at: datetime | None = field(default=None)
