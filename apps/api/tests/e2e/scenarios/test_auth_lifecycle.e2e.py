"""Scenario E2E du cycle de vie d'authentification.

Enchaine le parcours complet d'un utilisateur sur l'app FastAPI complete (real
Postgres via testcontainers) avec la verification d'email ACTIVEE :

    register -> verify -> login -> refresh -> logout -> forgot -> reset -> login

Verifie aussi qu'avec le flag de verification on, un compte non verifie ne peut
pas se connecter (403), et qu'apres verification il le peut. L'email sender est
un espion en memoire (on lit le token dans le lien) ; le rate limiter autorise
tout (on teste le parcours nominal, pas la limitation, couverte en integ).
"""

import time
from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import httpx
import pytest
from alembic.config import Config
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from testcontainers.postgres import PostgresContainer

from alembic import command
from app.auth.domain.interfaces.rate_limiter import RateLimiter
from app.auth.infrastructure.security.jwt_token_service import JwtTokenService
from app.auth.presentation.dependencies.auth_providers import get_email_sender, get_rate_limiter
from app.auth.presentation.dependencies.current_user import get_token_service
from app.core.config import Settings, get_settings
from app.core.database.request_session import get_request_session
from app.email.domain.value_objects.email_message import EmailMessage
from app.main import create_app

# scenarios -> e2e -> tests -> apps/api
_API_ROOT = Path(__file__).resolve().parents[3]
_SECRET = "secret-de-test-suffisamment-long-pour-hs256-32o"


def _wait_for_port(container: PostgresContainer, port: int, timeout: float = 60.0) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            container.get_exposed_port(port)
            return
        except (ConnectionError, ValueError, TypeError):
            time.sleep(0.3)
    raise TimeoutError(f"Port {port} not exposed within {timeout}s")


class _RecordingEmailSender:
    def __init__(self) -> None:
        self.sent: list[EmailMessage] = []

    async def send(self, message: EmailMessage) -> None:
        self.sent.append(message)


class _AllowAllRateLimiter(RateLimiter):
    async def is_allowed(self, key: str) -> bool:
        return True


@pytest.fixture(scope="module")
def postgres_url() -> Iterator[str]:
    container = PostgresContainer("postgres:16-alpine", driver="asyncpg")
    container.start()
    try:
        _wait_for_port(container, 5432)
        url = container.get_connection_url()
        config = Config(str(_API_ROOT / "alembic.ini"))
        config.set_main_option("script_location", str(_API_ROOT / "alembic"))
        config.set_main_option("sqlalchemy.url", url)
        command.upgrade(config, "head")
        yield url
    finally:
        container.stop()


def _token_from(message: EmailMessage) -> str:
    _, _, after = message.body_html.partition("?token=")
    token, _, _ = after.partition('"')
    return token


@pytest.fixture
async def client_and_emails(
    postgres_url: str,
) -> AsyncIterator[tuple[httpx.AsyncClient, _RecordingEmailSender]]:
    engine = create_async_engine(postgres_url)
    factory = async_sessionmaker(bind=engine, expire_on_commit=False)

    async def _override_session() -> AsyncIterator[AsyncSession]:
        async with factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    # Verification email EXIGEE (comme en test/preview/prod) : le scenario doit
    # passer par /verify avant de pouvoir se connecter.
    settings = Settings(
        jwt_secret=_SECRET,
        auth_require_email_verification=True,
        refresh_cookie_secure=False,
    )
    emails = _RecordingEmailSender()

    app = create_app(settings)
    app.dependency_overrides[get_request_session] = _override_session
    app.dependency_overrides[get_token_service] = lambda: JwtTokenService(secret=_SECRET)
    app.dependency_overrides[get_email_sender] = lambda: emails
    app.dependency_overrides[get_rate_limiter] = lambda: _AllowAllRateLimiter()
    app.dependency_overrides[get_settings] = lambda: settings

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="https://test") as client:
        yield client, emails
    await engine.dispose()


async def test_cycle_de_vie_complet(
    client_and_emails: tuple[httpx.AsyncClient, _RecordingEmailSender],
) -> None:
    client, emails = client_and_emails
    email = f"e2e-{time.monotonic_ns()}@stacknest.local"

    # 1. Inscription -> 202 + email de verification
    register = await client.post("/auth/register", json={"email": email, "password": "premier000"})
    assert register.status_code == 202
    verify_token = _token_from(emails.sent[-1])

    # 2. Connexion refusee tant que l'email n'est pas verifie (flag on)
    blocked = await client.post("/auth/login", json={"email": email, "password": "premier000"})
    assert blocked.status_code == 403

    # 3. Verification de l'email -> 204
    verify = await client.post("/auth/verify", json={"token": verify_token})
    assert verify.status_code == 204

    # 4. Connexion maintenant autorisee -> access token + cookie refresh
    login = await client.post("/auth/login", json={"email": email, "password": "premier000"})
    assert login.status_code == 200
    access = login.json()["access_token"]

    # 5. /me avec le Bearer access token
    me = await client.get("/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert me.status_code == 200
    assert me.json()["email"] == email

    # 6. Refresh via le cookie persiste -> nouvel access
    refreshed = await client.post("/auth/refresh")
    assert refreshed.status_code == 200
    assert refreshed.json()["access_token"]

    # 7. Logout -> 204
    logout = await client.post("/auth/logout", headers={"Authorization": f"Bearer {access}"})
    assert logout.status_code == 204

    # 8. Mot de passe oublie -> 202 + email de reset
    emails.sent.clear()
    forgot = await client.post("/auth/forgot", json={"email": email})
    assert forgot.status_code == 202
    reset_token = _token_from(emails.sent[-1])

    # 9. Reset -> 204, puis connexion avec le nouveau mot de passe
    reset = await client.post("/auth/reset", json={"token": reset_token, "password": "second0000"})
    assert reset.status_code == 204

    relogin = await client.post("/auth/login", json={"email": email, "password": "second0000"})
    assert relogin.status_code == 200
