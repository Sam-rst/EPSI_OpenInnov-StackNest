"""Tests unitaires du use case LogoutUser (fakes en memoire)."""

from uuid import UUID, uuid4

import pytest

from app.auth.application.logout_user import LogoutUser
from app.auth.domain.entities.user import User
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.exceptions.invalid_token import InvalidTokenException
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email


class _FakeUserRepository(UserRepository):
    def __init__(self, users: list[User]) -> None:
        self._by_id = {user.id: user for user in users}
        self.updated: list[User] = []

    async def get_by_id(self, user_id: UUID) -> User | None:
        return self._by_id.get(user_id)

    async def get_by_email(self, email: Email) -> User | None:
        raise NotImplementedError

    async def add(self, user: User) -> User:
        raise NotImplementedError

    async def update(self, user: User) -> User:
        self._by_id[user.id] = user
        self.updated.append(user)
        return user


def _user(token_version: int = 3) -> User:
    return User(
        id=uuid4(),
        email=Email("user@stacknest.local"),
        password_hash="hashed::x",
        role=UserRole.USER,
        is_verified=True,
        token_version=token_version,
    )


class TestLogoutUser:
    async def test_incremente_la_token_version(self) -> None:
        user = _user(token_version=3)
        repository = _FakeUserRepository([user])
        use_case = LogoutUser(repository=repository)

        await use_case.execute(user_id=user.id)

        assert repository.updated[0].token_version == 4

    async def test_utilisateur_inconnu_leve_invalid_token(self) -> None:
        use_case = LogoutUser(repository=_FakeUserRepository([]))

        with pytest.raises(InvalidTokenException):
            await use_case.execute(user_id=uuid4())
