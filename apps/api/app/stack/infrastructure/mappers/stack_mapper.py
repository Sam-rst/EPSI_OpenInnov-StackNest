"""Mapper de conversion entre l'entite `Stack` et le modele ORM.

Isole le domaine de SQLAlchemy : le repository ne manipule que des entites
`Stack`, le mapper se charge de la conversion bidirectionnelle avec le modele
`StackModel`.
"""

from app.stack.domain.entities.stack import Stack
from app.stack.infrastructure.models.stack_model import StackModel


class StackMapper:
    """Traduit entre le domaine (`Stack`) et la persistance (`StackModel`)."""

    @staticmethod
    def to_entity(model: StackModel) -> Stack:
        return Stack(
            id=model.id,
            owner_id=model.owner_id,
            name=model.name,
            status=model.status,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(entity: Stack) -> StackModel:
        # created_at / updated_at sont gardes cote base (server_default) : on ne
        # les transmet pas pour ne pas figer une valeur calculee a la creation.
        return StackModel(
            id=entity.id,
            owner_id=entity.owner_id,
            name=entity.name,
            status=entity.status,
        )
