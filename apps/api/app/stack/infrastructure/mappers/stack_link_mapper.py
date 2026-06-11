"""Mapper de conversion entre l'entite `StackLink` et le modele ORM."""

from app.stack.domain.entities.stack_link import StackLink
from app.stack.infrastructure.models.stack_link_model import StackLinkModel


class StackLinkMapper:
    """Traduit entre le domaine (`StackLink`) et la persistance (`StackLinkModel`)."""

    @staticmethod
    def to_entity(model: StackLinkModel) -> StackLink:
        return StackLink(
            id=model.id,
            stack_id=model.stack_id,
            from_service_id=model.from_service_id,
            to_service_id=model.to_service_id,
            var_mappings=dict(model.var_mappings),
        )

    @staticmethod
    def to_model(entity: StackLink) -> StackLinkModel:
        return StackLinkModel(
            id=entity.id,
            stack_id=entity.stack_id,
            from_service_id=entity.from_service_id,
            to_service_id=entity.to_service_id,
            var_mappings=dict(entity.var_mappings),
        )
