"""Tests unitaires du use case RefreshAccess (fakes en memoire)."""

from uuid import UUID, uuid4

import pytest

from app.auth.application.refresh_access import RefreshAccess
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

    async def get_by_id(self, user_id: UUID) -> User | None:
        return self._by_id.get(user_id)

    async def get_by_email(self, email: Email) -> User | None:
        raise NotImplementedError

    async def add(self, user: User) -> User:
        raise NotImplementedError

    async def update(self, user: User) -> User:
        raise NotImplementedError


class _FakeTokenService(TokenService):
    def __init__(self, claims: TokenClaims) -> None:
        self._claims = claims
        self.issued: list[dict[str, object]] = []
        self.decoded_purpose: TokenPurpose | None = None

    def issue(
        self,
        *,
        subject: UUID,
        purpose: TokenPurpose,
        role: UserRole,
        token_version: int,
        ttl_seconds: int,
    ) -> str:
        self.issued.append({"purpose": purpose, "ttl_seconds": ttl_seconds})
        return f"token::{purpose.value}"

    def decode(self, token: str, *, expected_purpose: TokenPurpose) -> TokenClaims:
        self.decoded_purpose = expected_purpose
        return self._claims


def _user(token_version: int = 3) -> User:
    return User(
        id=uuid4(),
        email=Email("user@stacknest.local"),
        password_hash="hashed::x",
        role=UserRole.USER,
        is_verified=True,
        token_version=token_version,
    )


def _claims(user: User, token_version: int | None = None) -> TokenClaims:
    return TokenClaims(
        subject=user.id,
        purpose=TokenPurpose.REFRESH,
        role=user.role,
        token_version=user.token_version if token_version is None else token_version,
    )


def _build(user: User, claims: TokenClaims) -> tuple[RefreshAccess, _FakeTokenService]:
    token_service = _FakeTokenService(claims)
    use_case = RefreshAccess(
        repository=_FakeUserRepository([user]),
        token_service=token_service,
        access_token_ttl_seconds=900,
        refresh_token_ttl_seconds=604800,
    )
    return use_case, token_service


class TestRefreshAccess:
    async def test_reemet_access_et_refresh(self) -> None:
        user = _user()
        use_case, token_service = _build(user, _claims(user))

        result = await use_case.execute(refresh_token="tok")

        assert result.access_token == "token::access"
        assert result.refresh_token == "token::refresh"
        purposes = {issued["purpose"] for issued in token_service.issued}
        assert purposes == {TokenPurpose.ACCESS, TokenPurpose.REFRESH}

    async def test_decode_avec_la_finalite_refresh(self) -> None:
        user = _user()
        use_case, token_service = _build(user, _claims(user))

        await use_case.execute(refresh_token="tok")

        assert token_service.decoded_purpose is TokenPurpose.REFRESH

    async def test_token_version_perimee_leve_invalid_token(self) -> None:
        user = _user(token_version=5)
        use_case, _ = _build(user, _claims(user, token_version=4))

        with pytest.raises(InvalidTokenException):
            await use_case.execute(refresh_token="tok")

    async def test_utilisateur_inconnu_leve_invalid_token(self) -> None:
        absent = _user()
        token_service = _FakeTokenService(_claims(absent))
        use_case = RefreshAccess(
            repository=_FakeUserRepository([]),
            token_service=token_service,
            access_token_ttl_seconds=900,
            refresh_token_ttl_seconds=604800,
        )

        with pytest.raises(InvalidTokenException):
            await use_case.execute(refresh_token="tok")
