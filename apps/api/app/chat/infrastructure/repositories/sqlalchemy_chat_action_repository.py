"""Implementation SQLAlchemy du depot des actions de chat."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.domain.interfaces.chat_action_repository import ChatActionRepository
from app.chat.infrastructure.mappers.chat_action_mapper import ChatActionMapper
from app.chat.infrastructure.models.chat_action_model import ChatActionModel


class SqlAlchemyChatActionRepository(ChatActionRepository):
    """Depot des actions de chat adosse a une `AsyncSession` SQLAlchemy.

    Le repository ne commit pas : la transaction est geree par l'appelant (unit
    of work par requete). Conserve la trace auditable du cycle proposition ->
    confirmation -> execution (status + deployment_id).
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, action: ChatAction) -> ChatAction:
        model = ChatActionMapper.to_model(action)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return ChatActionMapper.to_entity(model)

    async def get_by_id(self, action_id: UUID) -> ChatAction | None:
        model = await self._session.get(ChatActionModel, action_id)
        if model is None:
            return None
        return ChatActionMapper.to_entity(model)

    async def list_proposed_by_conversation(self, conversation_id: UUID) -> list[ChatAction]:
        result = await self._session.execute(
            select(ChatActionModel)
            .where(ChatActionModel.conversation_id == conversation_id)
            .where(ChatActionModel.status == ActionStatus.PROPOSED)
            .order_by(ChatActionModel.created_at)
        )
        return [ChatActionMapper.to_entity(model) for model in result.scalars().all()]

    async def update(self, action: ChatAction) -> ChatAction:
        model = await self._session.get(ChatActionModel, action.id)
        if model is None:
            model = ChatActionMapper.to_model(action)
            self._session.add(model)
        else:
            self._apply_mutable_fields(model, action)
        await self._session.flush()
        await self._session.refresh(model)
        return ChatActionMapper.to_entity(model)

    @staticmethod
    def _apply_mutable_fields(model: ChatActionModel, action: ChatAction) -> None:
        model.status = action.status
        model.args = dict(action.args)
        model.deployment_id = (
            UUID(action.deployment_id) if action.deployment_id is not None else None
        )
