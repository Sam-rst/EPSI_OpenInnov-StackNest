"""Implementation SQLAlchemy du depot de stacks, services et liens."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.stack.domain.entities.stack import Stack
from app.stack.domain.entities.stack_link import StackLink
from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.interfaces.stack_repository import StackRepository
from app.stack.infrastructure.mappers.stack_link_mapper import StackLinkMapper
from app.stack.infrastructure.mappers.stack_mapper import StackMapper
from app.stack.infrastructure.mappers.stack_service_mapper import StackServiceMapper
from app.stack.infrastructure.models.stack_link_model import StackLinkModel
from app.stack.infrastructure.models.stack_model import StackModel
from app.stack.infrastructure.models.stack_service_model import StackServiceModel


class SqlAlchemyStackRepository(StackRepository):
    """Depot de stacks adosse a une `AsyncSession` SQLAlchemy.

    Le repository ne commit pas : la transaction est geree par l'appelant (unit
    of work par requete). Les acces sont isoles par proprietaire via
    `list_by_owner`. La suppression d'une stack emporte ses services et liens
    (cascade ON DELETE au niveau base).
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, stack: Stack) -> Stack:
        model = StackMapper.to_model(stack)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return StackMapper.to_entity(model)

    async def get_by_id(self, stack_id: UUID) -> Stack | None:
        model = await self._session.get(StackModel, stack_id)
        if model is None:
            return None
        return StackMapper.to_entity(model)

    async def update_stack(self, stack: Stack) -> None:
        # Charge le modele puis mute le champ : `updated_at` se rafraichit via
        # l'`onupdate` ORM (pas de trigger base — cf. lot 1). Un UPDATE brut ne
        # le declencherait pas.
        model = await self._session.get(StackModel, stack.id)
        if model is None:
            return
        model.status = stack.status
        await self._session.flush()

    async def update_service(self, service: StackService) -> None:
        model = await self._session.get(StackServiceModel, service.id)
        if model is None:
            return
        model.service_status = service.service_status
        model.published_port = service.published_port
        model.container_ref = service.container_ref
        await self._session.flush()

    async def list_by_owner(self, owner_id: UUID) -> list[Stack]:
        result = await self._session.execute(
            select(StackModel)
            .where(StackModel.owner_id == owner_id)
            .order_by(StackModel.created_at)
        )
        return [StackMapper.to_entity(model) for model in result.scalars().all()]

    async def delete(self, stack_id: UUID) -> None:
        model = await self._session.get(StackModel, stack_id)
        if model is not None:
            await self._session.delete(model)
            await self._session.flush()

    async def add_service(self, service: StackService) -> StackService:
        model = StackServiceMapper.to_model(service)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return StackServiceMapper.to_entity(model)

    async def list_services(self, stack_id: UUID) -> list[StackService]:
        result = await self._session.execute(
            select(StackServiceModel)
            .where(StackServiceModel.stack_id == stack_id)
            .order_by(StackServiceModel.order_index)
        )
        return [StackServiceMapper.to_entity(model) for model in result.scalars().all()]

    async def add_link(self, link: StackLink) -> StackLink:
        model = StackLinkMapper.to_model(link)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return StackLinkMapper.to_entity(model)

    async def list_links(self, stack_id: UUID) -> list[StackLink]:
        result = await self._session.execute(
            select(StackLinkModel).where(StackLinkModel.stack_id == stack_id)
        )
        return [StackLinkMapper.to_entity(model) for model in result.scalars().all()]
