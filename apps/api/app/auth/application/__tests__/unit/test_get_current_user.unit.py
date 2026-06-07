"""Tests unitaires du use case GetCurrentUser (fakes en memoire)."""

from uuid import UUID, uuid4

import pytest

from app.auth.application.get_current_user import GetCurrentUser
from app.auth.domain.entities.user import User
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.exceptions.invalid_credentials import InvalidCredentialsException
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email


class _FakeUserRepository(UserRepository):
    def __init__(self, users: list[User]) -> None:
        self._by_id = {user.id: user for user in users}

    async def get_by_id(self, user_id: UUID) -> User | None:
        return self._by_id.get(user_id)

    async def get_by_email(self, email: Email) -> User | None:
        raise NotImplementedError

    async def add(self, user: User) -> User:
        raise NotImplementedError

    async def update(self, user: User) -> User:
        raise NotImplementedError


def _user() -> User:
    return User(
        id=uuid4(),
        email=Email("user@stacknest.local"),
        password_hash="hashed::x",
        role=UserRole.ADMIN,
        is_verified=True,
        token_version=1,
    )


class TestGetCurrentUser:
    async def test_renvoie_le_profil(self) -> None:
        user = _user()
        use_case = GetCurrentUser(repository=_FakeUserRepository([user]))

        found = await use_case.execute(user_id=user.id)

        assert found.id == user.id
        assert found.role is UserRole.ADMIN

    async def test_utilisateur_inconnu_leve_invalid_credentials(self) -> None:
        use_case = GetCurrentUser(repository=_FakeUserRepository([]))

        with pytest.raises(InvalidCredentialsException):
            await use_case.execute(user_id=uuid4())
