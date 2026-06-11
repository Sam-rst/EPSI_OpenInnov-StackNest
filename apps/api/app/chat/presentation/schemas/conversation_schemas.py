"""Schemas Pydantic du contrat REST des conversations de chat.

Miroir de l'API : requetes (creation / renommage / message) et reponses
(conversation, message). Decouple la presentation du domaine via des fabriques
`from_entity`. Le titre et le contenu sont valides non vides cote schema (422 en
amont du domaine).
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.value_objects.proposed_action import ProposedAction


class CreateConversationRequest(BaseModel):
    """Corps de creation d'un fil (titre optionnel, defaut cote use case)."""

    title: str | None = Field(default=None, max_length=200)


class RenameConversationRequest(BaseModel):
    """Corps de renommage d'un fil (titre non vide)."""

    title: str = Field(min_length=1, max_length=200)


class SendMessageRequest(BaseModel):
    """Corps d'envoi d'un message (contenu non vide)."""

    content: str = Field(min_length=1, max_length=10000)


class ConversationResponse(BaseModel):
    """Representation d'un fil renvoyee par l'API."""

    id: UUID
    title: str
    created_at: datetime | None
    updated_at: datetime | None

    @classmethod
    def from_entity(cls, conversation: Conversation) -> "ConversationResponse":
        """Construit la reponse a partir de l'entite de domaine."""
        return cls(
            id=conversation.id,
            title=conversation.title,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
        )


class MessageActionResponse(BaseModel):
    """Recap PUBLIC d'une proposition d'action rejouable sur son message d'amorce.

    Miroir exact de ce que l'event SSE `action_proposed` expose cote public
    (`action_id`, `kind`, `restatement`, `recap`) : permet au front de
    reconstruire la carte de confirmation au rechargement d'un fil. AUCUN secret
    (le `recap` reprend les `args` valides, deja masques par la gate).
    """

    action_id: UUID
    kind: ActionKind
    restatement: str
    recap: dict[str, Any]

    @classmethod
    def from_proposal(
        cls, proposal: ProposedAction, *, restatement: str
    ) -> "MessageActionResponse":
        """Construit le recap public a partir de la proposition + sa reformulation.

        La `restatement` n'est pas portee par la proposition : c'est le contenu du
        message assistant porteur (source unique, deja persistee).
        """
        return cls(
            action_id=proposal.action_id,
            kind=proposal.kind,
            restatement=restatement,
            recap=proposal.recap,
        )


class MessageResponse(BaseModel):
    """Representation d'un message renvoyee par l'API.

    Un message assistant peut porter une `action` (proposition encore `proposed`)
    afin que le front rejoue la carte de confirmation au rechargement du fil.
    """

    id: UUID
    role: MessageRole
    content: str
    created_at: datetime | None
    action: MessageActionResponse | None = None

    @classmethod
    def from_entity(
        cls, message: Message, *, proposal: ProposedAction | None = None
    ) -> "MessageResponse":
        """Construit la reponse a partir de l'entite (+ proposition rejouable eventuelle)."""
        action = (
            MessageActionResponse.from_proposal(proposal, restatement=message.content)
            if proposal is not None
            else None
        )
        return cls(
            id=message.id,
            role=message.role,
            content=message.content,
            created_at=message.created_at,
            action=action,
        )


class ConversationDetailResponse(BaseModel):
    """Detail d'un fil avec ses messages (vue conversation)."""

    conversation: ConversationResponse
    messages: list[MessageResponse]
