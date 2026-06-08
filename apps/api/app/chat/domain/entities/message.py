"""Entite de domaine Message : message persiste d'une conversation."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from app.chat.domain.enums.message_role import MessageRole


@dataclass
class Message:
    """Message echange dans une conversation et persiste en base.

    Entite identifiee par `id`, rattachee a une `Conversation` via
    `conversation_id`. Le contenu peut etre vide (message assistant ne portant
    qu'un appel d'outil). Aucune validation de longueur ici : le budget de
    tokens releve d'une garde metier (vague 2), pas de l'entite.

    `created_at` est gere cote base (server_default) : None avant persistance.

    - `conversation_id` : fil auquel appartient le message.
    - `role`            : emetteur (user / assistant / tool).
    - `content`         : texte du message (eventuellement vide).
    """

    id: UUID
    conversation_id: UUID
    role: MessageRole
    content: str
    created_at: datetime | None = field(default=None)
