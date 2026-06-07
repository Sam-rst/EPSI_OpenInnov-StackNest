"""Tests unitaires du use case RequestPasswordReset (fakes en memoire)."""

from uuid import UUID, uuid4

from app.auth.application.request_password_reset import RequestPasswordReset
from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email
from app.auth.domain.value_objects.token_claims import TokenClaims
from app.email.domain.value_objects.email_message import EmailMessage


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
        self.issued.append({"purpose": purpose, "ttl_seconds": ttl_seconds})
        return f"token::{purpose.value}"

    def decode(self, token: str, *, expected_purpose: TokenPurpose) -> TokenClaims:
        raise NotImplementedError


class _FakeEmailSender:
    def __init__(self) -> None:
        self.sent: list[EmailMessage] = []

    async def send(self, message: EmailMessage) -> None:
        self.sent.append(message)


def _user() -> User:
    return User(
        id=uuid4(),
        email=Email("user@stacknest.local"),
        password_hash="hashed::x",
        role=UserRole.USER,
        is_verified=True,
        token_version=2,
    )


def _build(
    users: list[User],
) -> tuple[RequestPasswordReset, _FakeTokenService, _FakeEmailSender]:
    token_service = _FakeTokenService()
    email_sender = _FakeEmailSender()
    use_case = RequestPasswordReset(
        repository=_FakeUserRepository(users),
        token_service=token_service,
        email_sender=email_sender,
        reset_token_ttl_seconds=1800,
        reset_url_base="https://app.stacknest.local/reset",
    )
    return use_case, token_service, email_sender


class TestRequestPasswordReset:
    async def test_compte_existant_envoie_un_email_reset(self) -> None:
        user = _user()
        use_case, token_service, email_sender = _build([user])

        await use_case.execute(email="user@stacknest.local")

        assert len(email_sender.sent) == 1
        assert email_sender.sent[0].to == "user@stacknest.local"
        assert token_service.issued[0]["purpose"] is TokenPurpose.RESET

    async def test_compte_inconnu_ne_revele_rien(self) -> None:
        use_case, token_service, email_sender = _build([])

        # Reponse generique : aucune erreur, mais aucun email/token non plus.
        await use_case.execute(email="inconnu@stacknest.local")

        assert email_sender.sent == []
        assert token_service.issued == []

    async def test_email_invalide_ne_revele_rien(self) -> None:
        use_case, token_service, email_sender = _build([])

        await use_case.execute(email="pas-un-email")

        assert email_sender.sent == []
        assert token_service.issued == []
