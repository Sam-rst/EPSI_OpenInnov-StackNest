"""Tests unitaires du use case LoginUser (fakes en memoire)."""

from uuid import UUID, uuid4

import pytest

from app.auth.application.login_user import LoginUser
from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.exceptions.email_not_verified import EmailNotVerifiedException
from app.auth.domain.exceptions.invalid_credentials import InvalidCredentialsException
from app.auth.domain.interfaces.password_hasher import PasswordHasher
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email
from app.auth.domain.value_objects.password import Password
from app.auth.domain.value_objects.token_claims import TokenClaims

_KNOWN_HASH = "hashed::motdepasse1"


class _FakeUserRepository(UserRepository):
    def __init__(self, users: list[User]) -> None:
        self._by_email = {user.email.value: user for user in users}

    async def get_by_email(self, email: Email) -> User | None:
        return self._by_email.get(email.value)

    async def get_by_id(self, user_id: UUID) -> User | None:
        raise NotImplementedError

    async def add(self, user: User) -> User:
        raise NotImplementedError

    async def update(self, user: User) -> User:
        raise NotImplementedError


class _SpyHasher(PasswordHasher):
    def __init__(self) -> None:
        self.verify_calls: list[str] = []

    def hash(self, password: Password) -> str:
        return f"hashed::{password.value}"

    def verify(self, password: Password, password_hash: str) -> bool:
        self.verify_calls.append(password_hash)
        return password_hash == f"hashed::{password.value}"


class _FakeTokenService(TokenService):
    def __init__(self) -> None:
        self.issued: list[dict[str, object]] = []

    def issue(
        self,
        *,
        subject: UUID,
        purpose: TokenPurpose,
        role: UserRole,
        token_version: int,
        ttl_seconds: int,
    ) -> str:
        self.issued.append({"purpose": purpose, "ttl_seconds": ttl_seconds, "subject": subject})
        return f"token::{purpose.value}"

    def decode(self, token: str, *, expected_purpose: TokenPurpose) -> TokenClaims:
        raise NotImplementedError


def _user(verified: bool = True) -> User:
    return User(
        id=uuid4(),
        email=Email("user@stacknest.local"),
        password_hash=_KNOWN_HASH,
        role=UserRole.USER,
        is_verified=verified,
        token_version=3,
    )


def _build(
    users: list[User], *, require_verification: bool = False
) -> tuple[LoginUser, _SpyHasher, _FakeTokenService]:
    hasher = _SpyHasher()
    token_service = _FakeTokenService()
    use_case = LoginUser(
        repository=_FakeUserRepository(users),
        hasher=hasher,
        token_service=token_service,
        require_email_verification=require_verification,
        access_token_ttl_seconds=900,
        refresh_token_ttl_seconds=604800,
    )
    return use_case, hasher, token_service


class TestLoginUser:
    async def test_succes_renvoie_access_et_refresh(self) -> None:
        user = _user()
        use_case, _, token_service = _build([user])

        result = await use_case.execute(email="user@stacknest.local", password="motdepasse1")

        assert result.user.id == user.id
        assert result.access_token == "token::access"
        assert result.refresh_token == "token::refresh"
        purposes = {issued["purpose"] for issued in token_service.issued}
        assert purposes == {TokenPurpose.ACCESS, TokenPurpose.REFRESH}

    async def test_mauvais_mot_de_passe_leve_invalid_credentials(self) -> None:
        use_case, _, _ = _build([_user()])

        with pytest.raises(InvalidCredentialsException):
            await use_case.execute(email="user@stacknest.local", password="mauvais0000")

    async def test_email_inconnu_leve_invalid_credentials(self) -> None:
        use_case, _, _ = _build([])

        with pytest.raises(InvalidCredentialsException):
            await use_case.execute(email="inconnu@stacknest.local", password="motdepasse1")

    async def test_email_inconnu_verifie_quand_meme_un_hash_anti_timing(self) -> None:
        # Pour ne pas reveler l'absence du compte par un temps de reponse plus
        # court, le use case execute une verification de hash meme sans user.
        use_case, hasher, _ = _build([])

        with pytest.raises(InvalidCredentialsException):
            await use_case.execute(email="inconnu@stacknest.local", password="motdepasse1")

        assert len(hasher.verify_calls) == 1

    async def test_non_verifie_avec_flag_on_leve_email_not_verified(self) -> None:
        user = _user(verified=False)
        use_case, _, _ = _build([user], require_verification=True)

        with pytest.raises(EmailNotVerifiedException):
            await use_case.execute(email="user@stacknest.local", password="motdepasse1")

    async def test_non_verifie_avec_flag_off_autorise(self) -> None:
        user = _user(verified=False)
        use_case, _, _ = _build([user], require_verification=False)

        result = await use_case.execute(email="user@stacknest.local", password="motdepasse1")

        assert result.access_token == "token::access"

    async def test_email_invalide_leve_invalid_credentials(self) -> None:
        # Une saisie d'email malformee ne doit pas faire fuiter une 500/ValueError :
        # elle est traitee comme un identifiant invalide.
        use_case, _, _ = _build([])

        with pytest.raises(InvalidCredentialsException):
            await use_case.execute(email="pas-un-email", password="motdepasse1")
