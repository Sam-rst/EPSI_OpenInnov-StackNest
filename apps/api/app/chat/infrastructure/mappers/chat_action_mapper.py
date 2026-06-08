"""Mapper de conversion entre l'entite `ChatAction` et le modele ORM.

Isole le domaine de SQLAlchemy : le repository ne manipule que des entites
`ChatAction`, le mapper se charge de la conversion bidirectionnelle avec le
modele `ChatActionModel`, y compris la traduction du `deployment_id` opaque
(`str` cote domaine) vers la FK UUID de la table `deployments`.
"""

from uuid import UUID

from app.chat.domain.entities.chat_action import ChatAction
from app.chat.infrastructure.models.chat_action_model import ChatActionModel


class ChatActionMapper:
    """Traduit entre le domaine (`ChatAction`) et la persistance (`ChatActionModel`)."""

    @staticmethod
    def to_entity(model: ChatActionModel) -> ChatAction:
        return ChatAction(
            id=model.id,
            conversation_id=model.conversation_id,
            message_id=model.message_id,
            kind=model.kind,
            args=dict(model.args),
            status=model.status,
            deployment_id=str(model.deployment_id) if model.deployment_id is not None else None,
            created_at=model.created_at,
        )

    @staticmethod
    def to_model(entity: ChatAction) -> ChatActionModel:
        # created_at est garde cote base (server_default) : non transmis.
        return ChatActionModel(
            id=entity.id,
            conversation_id=entity.conversation_id,
            message_id=entity.message_id,
            kind=entity.kind,
            args=dict(entity.args),
            status=entity.status,
            deployment_id=UUID(entity.deployment_id) if entity.deployment_id is not None else None,
        )
