"""Implementation SQLAlchemy du depot de conversations et de leurs messages."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.interfaces.conversation_repository import ConversationRepository
from app.chat.infrastructure.mappers.conversation_mapper import ConversationMapper
from app.chat.infrastructure.mappers.message_mapper import MessageMapper
from app.chat.infrastructure.models.conversation_model import ConversationModel
from app.chat.infrastructure.models.message_model import MessageModel


class SqlAlchemyConversationRepository(ConversationRepository):
    """Depot de conversations adosse a une `AsyncSession` SQLAlchemy.

    Le repository ne commit pas : la transaction est geree par l'appelant (unit
    of work par requete). Les acces sont isoles par proprietaire via
    `list_by_owner`. La suppression d'un fil emporte ses messages (cascade ON
    DELETE au niveau base).
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, conversation: Conversation) -> Conversation:
        model = ConversationMapper.to_model(conversation)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return ConversationMapper.to_entity(model)

    async def get_by_id(self, conversation_id: UUID) -> Conversation | None:
        model = await self._session.get(ConversationModel, conversation_id)
        if model is None:
            return None
        return ConversationMapper.to_entity(model)

    async def list_by_owner(self, owner_id: UUID) -> list[Conversation]:
        result = await self._session.execute(
            select(ConversationModel)
            .where(ConversationModel.owner_id == owner_id)
            .order_by(ConversationModel.created_at)
        )
        return [ConversationMapper.to_entity(model) for model in result.scalars().all()]

    async def update(self, conversation: Conversation) -> Conversation:
        model = await self._session.get(ConversationModel, conversation.id)
        if model is None:
            model = ConversationMapper.to_model(conversation)
            self._session.add(model)
        else:
            model.title = conversation.title
        await self._session.flush()
        await self._session.refresh(model)
        return ConversationMapper.to_entity(model)

    async def delete(self, conversation_id: UUID) -> None:
        model = await self._session.get(ConversationModel, conversation_id)
        if model is not None:
            await self._session.delete(model)
            await self._session.flush()

    async def add_message(self, message: Message) -> Message:
        model = MessageMapper.to_model(message)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return MessageMapper.to_entity(model)

    async def list_messages(self, conversation_id: UUID) -> list[Message]:
        # Tri chronologique par `created_at` (clock_timestamp() -> distinct par
        # insertion). `id` en cle de departage : stable et donc deterministe meme
        # pour d'eventuelles lignes historiques au meme horodatage (legacy now()),
        # ce qui evite que l'ordre « flotte » d'un rechargement a l'autre.
        result = await self._session.execute(
            select(MessageModel)
            .where(MessageModel.conversation_id == conversation_id)
            .order_by(MessageModel.created_at, MessageModel.id)
        )
        return [MessageMapper.to_entity(model) for model in result.scalars().all()]
