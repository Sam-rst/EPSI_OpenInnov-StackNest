"""Tests unitaires du use case RegisterUser (fakes en memoire)."""

from uuid import UUID, uuid4

import pytest

from app.auth.application.register_user import RegisterUser
from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.interfaces.password_hasher import PasswordHasher
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email
from app.auth.domain.value_objects.password import Password
from app.auth.domain.value_objects.token_claims import TokenClaims
from app.email.domain.value_objects.email_message import EmailMessage


class _FakeUserRepository(UserRepository):
    def __init__(self) -> None:
        self._by_email: dict[str, User] = {}
        self.added: list[User] = []

    async def get_by_email(self, email: Email) -> User | None:
        return self._by_email.get(email.value)

    async def get_by_id(self, user_id: UUID) -> User | None:
        for user in self._by_email.values():
            if user.id == user_id:
                return user
        return None

    async def add(self, user: User) -> User:
        self._by_email[user.email.value] = user
        self.added.append(user)
        return user

    async def update(self, user: User) -> User:
        self._by_email[user.email.value] = user
        return user


class _FakeHasher(PasswordHasher):
    def hash(self, password: Password) -> str:
        return f"hashed::{password.value}"

    def verify(self, password: Password, password_hash: str) -> bool:
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
        self.issued.append(
            {
                "subject": subject,
                "purpose": purpose,
                "token_version": token_version,
                "ttl_seconds": ttl_seconds,
            }
        )
        return f"token::{purpose.value}::{subject}"

    def decode(self, token: str, *, expected_purpose: TokenPurpose) -> TokenClaims:
        raise NotImplementedError


class _FakeEmailSender:
    def __init__(self) -> None:
        self.sent: list[EmailMessage] = []

    async def send(self, message: EmailMessage) -> None:
        self.sent.append(message)


def _build(
    verify_ttl: int = 3600,
) -> tuple[RegisterUser, _FakeUserRepository, _FakeTokenService, _FakeEmailSender]:
    repository = _FakeUserRepository()
    token_service = _FakeTokenService()
    email_sender = _FakeEmailSender()
    use_case = RegisterUser(
        repository=repository,
        hasher=_FakeHasher(),
        token_service=token_service,
        email_sender=email_sender,
        verify_token_ttl_seconds=verify_ttl,
        verify_url_base="https://app.stacknest.local/verify",
    )
    return use_case, repository, token_service, email_sender


class TestRegisterUser:
    async def test_cree_un_utilisateur_non_verifie(self) -> None:
        use_case, repository, _, _ = _build()

        await use_case.execute(email="Nouveau@Stacknest.Local", password="motdepasse1")

        assert len(repository.added) == 1
        created = repository.added[0]
        assert created.email == Email("nouveau@stacknest.local")
        assert created.is_verified is False
        assert created.role is UserRole.USER

    async def test_hash_le_mot_de_passe(self) -> None:
        use_case, repository, _, _ = _build()

        await use_case.execute(email="user@stacknest.local", password="motdepasse1")

        assert repository.added[0].password_hash == "hashed::motdepasse1"

    async def test_emet_un_token_de_verification(self) -> None:
        use_case, repository, token_service, _ = _build(verify_ttl=7200)

        await use_case.execute(email="user@stacknest.local", password="motdepasse1")

        assert len(token_service.issued) == 1
        issued = token_service.issued[0]
        assert issued["purpose"] is TokenPurpose.VERIFY
        assert issued["subject"] == repository.added[0].id
        assert issued["ttl_seconds"] == 7200

    async def test_envoie_un_email_de_verification(self) -> None:
        use_case, _, _, email_sender = _build()

        await use_case.execute(email="user@stacknest.local", password="motdepasse1")

        assert len(email_sender.sent) == 1
        message = email_sender.sent[0]
        assert message.to == "user@stacknest.local"
        assert "verify" in message.body_html
        assert "token::verify" in message.body_html

    async def test_email_deja_utilise_n_emet_rien_anti_enumeration(self) -> None:
        use_case, repository, token_service, email_sender = _build()
        existant = User(
            id=uuid4(),
            email=Email("user@stacknest.local"),
            password_hash="hashed::deja",
            is_verified=True,
        )
        await repository.add(existant)

        await use_case.execute(email="user@stacknest.local", password="motdepasse1")

        # Aucun nouvel utilisateur, aucun token, aucun email (pas de fuite d'info).
        assert repository.added == [existant]
        assert token_service.issued == []
        assert email_sender.sent == []

    async def test_mot_de_passe_invalide_leve_value_error(self) -> None:
        use_case, _, _, _ = _build()

        with pytest.raises(ValueError):
            await use_case.execute(email="user@stacknest.local", password="court")

    async def test_email_invalide_leve_value_error(self) -> None:
        use_case, _, _, _ = _build()

        with pytest.raises(ValueError):
            await use_case.execute(email="pas-un-email", password="motdepasse1")
