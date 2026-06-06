"""Tests unitaires du use case VerifyEmail (fakes en memoire)."""

from uuid import UUID, uuid4

import pytest

from app.auth.application.verify_email import VerifyEmail
from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.exceptions.invalid_token import InvalidTokenException
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email
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


class _FakeTokenService(TokenService):
    def __init__(self, claims: TokenClaims | None = None, error: Exception | None = None) -> None:
        self._claims = claims
        self._error = error
        self.decoded_purpose: TokenPurpose | None = None

    def issue(self, **_: object) -> str:
        raise NotImplementedError

    def decode(self, token: str, *, expected_purpose: TokenPurpose) -> TokenClaims:
        self.decoded_purpose = expected_purpose
        if self._error is not None:
            raise self._error
        assert self._claims is not None
        return self._claims


def _user(verified: bool = False, token_version: int = 0) -> User:
    return User(
        id=uuid4(),
        email=Email("user@stacknest.local"),
        password_hash="hashed::x",
        role=UserRole.USER,
        is_verified=verified,
        token_version=token_version,
    )


def _claims(user: User) -> TokenClaims:
    return TokenClaims(
        subject=user.id,
        purpose=TokenPurpose.VERIFY,
        role=user.role,
        token_version=user.token_version,
    )


class TestVerifyEmail:
    async def test_verifie_le_compte(self) -> None:
        user = _user(verified=False)
        repository = _FakeUserRepository([user])
        token_service = _FakeTokenService(claims=_claims(user))
        use_case = VerifyEmail(repository=repository, token_service=token_service)

        await use_case.execute(token="tok")

        assert repository.updated[0].is_verified is True

    async def test_decode_avec_la_finalite_verify(self) -> None:
        user = _user()
        token_service = _FakeTokenService(claims=_claims(user))
        use_case = VerifyEmail(repository=_FakeUserRepository([user]), token_service=token_service)

        await use_case.execute(token="tok")

        assert token_service.decoded_purpose is TokenPurpose.VERIFY

    async def test_idempotent_si_deja_verifie(self) -> None:
        user = _user(verified=True)
        repository = _FakeUserRepository([user])
        token_service = _FakeTokenService(claims=_claims(user))
        use_case = VerifyEmail(repository=repository, token_service=token_service)

        await use_case.execute(token="tok")

        # Pas d'erreur ; le compte reste verifie.
        assert user.is_verified is True

    async def test_utilisateur_inconnu_leve_invalid_token(self) -> None:
        absent = _user()
        token_service = _FakeTokenService(claims=_claims(absent))
        use_case = VerifyEmail(repository=_FakeUserRepository([]), token_service=token_service)

        with pytest.raises(InvalidTokenException):
            await use_case.execute(token="tok")

    async def test_token_invalide_propage_l_erreur(self) -> None:
        token_service = _FakeTokenService(error=InvalidTokenException())
        use_case = VerifyEmail(repository=_FakeUserRepository([]), token_service=token_service)

        with pytest.raises(InvalidTokenException):
            await use_case.execute(token="tok")
