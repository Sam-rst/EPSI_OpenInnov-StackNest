"""Mapper de conversion entre l'entite `Conversation` et le modele ORM.

Isole le domaine de SQLAlchemy : le repository ne manipule que des entites
`Conversation`, le mapper se charge de la conversion bidirectionnelle avec le
modele `ConversationModel`.
"""

from app.chat.domain.entities.conversation import Conversation
from app.chat.infrastructure.models.conversation_model import ConversationModel


class ConversationMapper:
    """Traduit entre le domaine (`Conversation`) et la persistance (`ConversationModel`)."""

    @staticmethod
    def to_entity(model: ConversationModel) -> Conversation:
        return Conversation(
            id=model.id,
            owner_id=model.owner_id,
            title=model.title,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(entity: Conversation) -> ConversationModel:
        # created_at / updated_at sont gardes cote base (server_default) : on ne
        # les transmet pas pour ne pas figer une valeur calculee a la creation.
        return ConversationModel(
            id=entity.id,
            owner_id=entity.owner_id,
            title=entity.title,
        )
