"""Mapper de conversion entre l'entite `StackService` et le modele ORM."""

from app.stack.domain.entities.stack_service import StackService
from app.stack.infrastructure.models.stack_service_model import StackServiceModel


class StackServiceMapper:
    """Traduit entre le domaine (`StackService`) et la persistance (`StackServiceModel`)."""

    @staticmethod
    def to_entity(model: StackServiceModel) -> StackService:
        return StackService(
            id=model.id,
            stack_id=model.stack_id,
            template_id=model.template_id,
            version=model.version,
            alias=model.alias,
            service_status=model.service_status,
            order_index=model.order_index,
            params=dict(model.params),
            published_port=model.published_port,
            container_ref=model.container_ref,
        )

    @staticmethod
    def to_model(entity: StackService) -> StackServiceModel:
        return StackServiceModel(
            id=entity.id,
            stack_id=entity.stack_id,
            template_id=entity.template_id,
            version=entity.version,
            alias=entity.alias,
            service_status=entity.service_status,
            order_index=entity.order_index,
            params=dict(entity.params),
            published_port=entity.published_port,
            container_ref=entity.container_ref,
        )
