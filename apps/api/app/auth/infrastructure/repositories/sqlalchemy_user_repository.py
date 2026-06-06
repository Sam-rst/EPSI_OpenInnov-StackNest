"""Implementation SQLAlchemy du depot d'utilisateurs."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.domain.entities.user import User
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email
from app.auth.infrastructure.mappers.user_mapper import UserMapper
from app.auth.infrastructure.models.user_model import UserModel


class SqlAlchemyUserRepository(UserRepository):
    """Depot d'utilisateurs adosse a une `AsyncSession` SQLAlchemy.

    Le repository ne commit pas : la transaction est geree par l'appelant
    (unit of work par requete, cf. `core.database.session`). Il flush quand il
    a besoin que la base attribue les valeurs server_default (id, timestamps).
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: Email) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.email == email.value)
        )
        model = result.scalar_one_or_none()
        return UserMapper.to_entity(model) if model else None

    async def get_by_id(self, user_id: UUID) -> User | None:
        model = await self._session.get(UserModel, user_id)
        return UserMapper.to_entity(model) if model else None

    async def add(self, user: User) -> User:
        model = UserMapper.to_model(user)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return UserMapper.to_entity(model)

    async def update(self, user: User) -> User:
        model = await self._session.get(UserModel, user.id)
        if model is None:
            model = UserMapper.to_model(user)
            self._session.add(model)
        else:
            model.email = user.email.value
            model.password_hash = user.password_hash
            model.role = user.role
            model.is_verified = user.is_verified
            model.token_version = user.token_version
        await self._session.flush()
        await self._session.refresh(model)
        return UserMapper.to_entity(model)
