"""Schemas Pydantic du contrat REST des conversations de chat.

Miroir de l'API : requetes (creation / renommage / message) et reponses
(conversation, message). Decouple la presentation du domaine via des fabriques
`from_entity`. Le titre et le contenu sont valides non vides cote schema (422 en
amont du domaine).
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.enums.message_role import MessageRole


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


class MessageResponse(BaseModel):
    """Representation d'un message renvoyee par l'API."""

    id: UUID
    role: MessageRole
    content: str
    created_at: datetime | None

    @classmethod
    def from_entity(cls, message: Message) -> "MessageResponse":
        """Construit la reponse a partir de l'entite de domaine."""
        return cls(
            id=message.id,
            role=message.role,
            content=message.content,
            created_at=message.created_at,
        )


class ConversationDetailResponse(BaseModel):
    """Detail d'un fil avec ses messages (vue conversation)."""

    conversation: ConversationResponse
    messages: list[MessageResponse]
