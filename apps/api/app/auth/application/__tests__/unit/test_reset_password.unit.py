"""Tests unitaires du use case ResetPassword (fakes en memoire)."""

from uuid import UUID, uuid4

import pytest

from app.auth.application.reset_password import ResetPassword
from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.exceptions.invalid_token import InvalidTokenException
from app.auth.domain.interfaces.password_hasher import PasswordHasher
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email
from app.auth.domain.value_objects.password import Password
from app.auth.domain.value_objects.token_claims import TokenClaims


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


class _FakeHasher(PasswordHasher):
    def hash(self, password: Password) -> str:
        return f"hashed::{password.value}"

    def verify(self, password: Password, password_hash: str) -> bool:
        return password_hash == f"hashed::{password.value}"


class _FakeTokenService(TokenService):
    def __init__(self, claims: TokenClaims) -> None:
        self._claims = claims
        self.decoded_purpose: TokenPurpose | None = None

    def issue(self, **_: object) -> str:
        raise NotImplementedError

    def decode(self, token: str, *, expected_purpose: TokenPurpose) -> TokenClaims:
        self.decoded_purpose = expected_purpose
        return self._claims


def _user(token_version: int = 2) -> User:
    return User(
        id=uuid4(),
        email=Email("user@stacknest.local"),
        password_hash="hashed::ancien0",
        role=UserRole.USER,
        is_verified=True,
        token_version=token_version,
    )


def _claims(user: User, token_version: int | None = None) -> TokenClaims:
    return TokenClaims(
        subject=user.id,
        purpose=TokenPurpose.RESET,
        role=user.role,
        token_version=user.token_version if token_version is None else token_version,
    )


def _build(
    user: User, claims: TokenClaims
) -> tuple[ResetPassword, _FakeUserRepository, _FakeTokenService]:
    repository = _FakeUserRepository([user])
    token_service = _FakeTokenService(claims)
    use_case = ResetPassword(
        repository=repository, hasher=_FakeHasher(), token_service=token_service
    )
    return use_case, repository, token_service


class TestResetPassword:
    async def test_remplace_le_hash(self) -> None:
        user = _user()
        use_case, repository, _ = _build(user, _claims(user))

        await use_case.execute(token="tok", new_password="nouveaupass1")

        assert repository.updated[0].password_hash == "hashed::nouveaupass1"

    async def test_bump_la_token_version(self) -> None:
        user = _user(token_version=2)
        use_case, repository, _ = _build(user, _claims(user))

        await use_case.execute(token="tok", new_password="nouveaupass1")

        assert repository.updated[0].token_version == 3

    async def test_decode_avec_la_finalite_reset(self) -> None:
        user = _user()
        use_case, _, token_service = _build(user, _claims(user))

        await use_case.execute(token="tok", new_password="nouveaupass1")

        assert token_service.decoded_purpose is TokenPurpose.RESET

    async def test_token_deja_consomme_leve_invalid_token(self) -> None:
        # Le token portait token_version=2 ; le compte est deja a 3 (reset
        # precedent) -> single-use garanti par le bump.
        user = _user(token_version=3)
        use_case, _, _ = _build(user, _claims(user, token_version=2))

        with pytest.raises(InvalidTokenException):
            await use_case.execute(token="tok", new_password="nouveaupass1")

    async def test_utilisateur_inconnu_leve_invalid_token(self) -> None:
        absent = _user()
        token_service = _FakeTokenService(_claims(absent))
        use_case = ResetPassword(
            repository=_FakeUserRepository([]),
            hasher=_FakeHasher(),
            token_service=token_service,
        )

        with pytest.raises(InvalidTokenException):
            await use_case.execute(token="tok", new_password="nouveaupass1")

    async def test_mot_de_passe_faible_leve_value_error(self) -> None:
        user = _user()
        use_case, _, _ = _build(user, _claims(user))

        with pytest.raises(ValueError):
            await use_case.execute(token="tok", new_password="faible")
