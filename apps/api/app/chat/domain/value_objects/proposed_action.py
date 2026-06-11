"""Value object ProposedAction : récap PUBLIC d'une proposition rejouable.

Au rechargement d'un fil, une proposition d'action encore `proposed` doit
reapparaitre attachee a son message d'amorce (carte de confirmation). Cet objet
porte exactement ce que l'event SSE `action_proposed` expose cote public —
`action_id`, `kind`, `recap` — rattache au `message_id` qui l'a emise. La
reformulation (`restatement`) n'est PAS dupliquee ici : elle EST le contenu du
message assistant porteur. AUCUN secret ne transite par le `recap` (memes regles
de masquage que la gate, dont les `args` valides excluent deja les secrets).
"""

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from app.chat.domain.enums.action_kind import ActionKind


@dataclass(frozen=True)
class ProposedAction:
    """Proposition encore `proposed` rejouable sur son message d'amorce.

    - `action_id`  : identifiant de la `ChatAction` (cible des routes confirm/reject).
    - `message_id` : message assistant ayant emis la proposition.
    - `kind`       : nature de l'action (deploy / stop / start / regenerate).
    - `recap`      : recapitulatif public affiche dans la carte (sans secret).
    """

    action_id: UUID
    message_id: UUID
    kind: ActionKind
    recap: dict[str, Any] = field(default_factory=dict)
