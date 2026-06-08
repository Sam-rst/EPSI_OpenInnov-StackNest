"""Mapper de conversion entre l'entite `Message` et le modele ORM.

Isole le domaine de SQLAlchemy : le repository ne manipule que des entites
`Message`, le mapper se charge de la conversion bidirectionnelle avec le modele
`MessageModel`.
"""

from app.chat.domain.entities.message import Message
from app.chat.infrastructure.models.message_model import MessageModel


class MessageMapper:
    """Traduit entre le domaine (`Message`) et la persistance (`MessageModel`)."""

    @staticmethod
    def to_entity(model: MessageModel) -> Message:
        return Message(
            id=model.id,
            conversation_id=model.conversation_id,
            role=model.role,
            content=model.content,
            created_at=model.created_at,
        )

    @staticmethod
    def to_model(entity: Message) -> MessageModel:
        # created_at est garde cote base (server_default) : non transmis.
        return MessageModel(
            id=entity.id,
            conversation_id=entity.conversation_id,
            role=entity.role,
            content=entity.content,
        )
