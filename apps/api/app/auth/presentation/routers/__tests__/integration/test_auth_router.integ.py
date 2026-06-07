"""Tests d'integration du router /auth contre un Postgres reel (testcontainers).

Monte l'app FastAPI complete, branche un repository SQLAlchemy sur un Postgres
de test (migrations Alembic appliquees), et appelle les endpoints via httpx
ASGI. L'email sender et le rate limiter sont remplaces par des fakes en memoire
(pas de SMTP/Redis reel necessaire pour valider les flows HTTP). Les tokens et
le hash sont reels (JwtTokenService + bcrypt).
"""

import time
from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import httpx
import pytest
from alembic.config import Config
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from testcontainers.postgres import PostgresContainer

from alembic import command
from app.auth.domain.interfaces.rate_limiter import RateLimiter
from app.auth.infrastructure.security.jwt_token_service import JwtTokenService
from app.auth.presentation.dependencies.auth_providers import (
    get_email_sender,
    get_rate_limiter,
)
from app.auth.presentation.dependencies.current_user import get_token_service
from app.core.config import Settings, get_settings
from app.core.database.request_session import get_request_session
from app.email.domain.value_objects.email_message import EmailMessage
from app.main import create_app

# integration -> __tests__ -> routers -> presentation -> auth -> app -> apps/api
_API_ROOT = Path(__file__).resolve().parents[6]
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


class _BlockAllRateLimiter(RateLimiter):
    async def is_allowed(self, key: str) -> bool:
        return False


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


def _extract_token(message: EmailMessage) -> str:
    """Recupere le token porte par le lien (?token=...) du dernier email."""
    _, _, after = message.body_html.partition("?token=")
    token, _, _ = after.partition('"')
    return token


class _AuthTestHarness:
    """Regroupe l'app, le client HTTP et les espions (email)."""

    def __init__(
        self, app: FastAPI, client: httpx.AsyncClient, emails: _RecordingEmailSender
    ) -> None:
        self.app = app
        self.client = client
        self.emails = emails


@pytest.fixture
async def harness(postgres_url: str) -> AsyncIterator[_AuthTestHarness]:
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

    # verification email off + cookie non secure (inspectable en HTTP de test).
    settings = Settings(
        jwt_secret=_SECRET,
        auth_require_email_verification=False,
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
        yield _AuthTestHarness(app, client, emails)
    await engine.dispose()


def _unique_email(prefix: str) -> str:
    return f"{prefix}-{time.monotonic_ns()}@stacknest.local"


class TestRegisterAndVerify:
    async def test_register_renvoie_202_et_envoie_un_email(self, harness: _AuthTestHarness) -> None:
        email = _unique_email("register")

        response = await harness.client.post(
            "/auth/register", json={"email": email, "password": "motdepasse1"}
        )

        assert response.status_code == 202
        assert len(harness.emails.sent) == 1
        assert harness.emails.sent[0].to == email

    async def test_register_email_deja_pris_reste_202(self, harness: _AuthTestHarness) -> None:
        email = _unique_email("dup")
        await harness.client.post(
            "/auth/register", json={"email": email, "password": "motdepasse1"}
        )

        # Deuxieme inscription sur le meme email : meme reponse generique.
        response = await harness.client.post(
            "/auth/register", json={"email": email, "password": "autremdp123"}
        )

        assert response.status_code == 202
        # Aucun second email (anti-enumeration : pas de creation).
        assert len(harness.emails.sent) == 1

    async def test_verify_active_le_compte(self, harness: _AuthTestHarness) -> None:
        email = _unique_email("verify")
        await harness.client.post(
            "/auth/register", json={"email": email, "password": "motdepasse1"}
        )
        token = _extract_token(harness.emails.sent[-1])

        response = await harness.client.post("/auth/verify", json={"token": token})

        assert response.status_code == 204

    async def test_verify_token_invalide_renvoie_401(self, harness: _AuthTestHarness) -> None:
        response = await harness.client.post("/auth/verify", json={"token": "pas-un-jwt"})

        assert response.status_code == 401


class TestLoginRefreshLogout:
    async def _register(self, harness: _AuthTestHarness, email: str) -> None:
        await harness.client.post(
            "/auth/register", json={"email": email, "password": "motdepasse1"}
        )

    async def test_login_renvoie_access_et_cookie_refresh(self, harness: _AuthTestHarness) -> None:
        email = _unique_email("login")
        await self._register(harness, email)

        response = await harness.client.post(
            "/auth/login", json={"email": email, "password": "motdepasse1"}
        )

        assert response.status_code == 200
        body = response.json()
        assert body["access_token"]
        assert body["user"]["email"] == email
        assert "stacknest_refresh" in response.cookies

    async def test_login_mauvais_mot_de_passe_renvoie_401(self, harness: _AuthTestHarness) -> None:
        email = _unique_email("badpw")
        await self._register(harness, email)

        response = await harness.client.post(
            "/auth/login", json={"email": email, "password": "mauvais0000"}
        )

        assert response.status_code == 401

    async def test_me_renvoie_le_profil(self, harness: _AuthTestHarness) -> None:
        email = _unique_email("me")
        await self._register(harness, email)
        login = await harness.client.post(
            "/auth/login", json={"email": email, "password": "motdepasse1"}
        )
        access = login.json()["access_token"]

        response = await harness.client.get(
            "/auth/me", headers={"Authorization": f"Bearer {access}"}
        )

        assert response.status_code == 200
        assert response.json()["email"] == email

    async def test_me_sans_token_renvoie_401(self, harness: _AuthTestHarness) -> None:
        response = await harness.client.get("/auth/me")

        assert response.status_code == 401

    async def test_refresh_renvoie_un_nouvel_access(self, harness: _AuthTestHarness) -> None:
        email = _unique_email("refresh")
        await self._register(harness, email)
        login = await harness.client.post(
            "/auth/login", json={"email": email, "password": "motdepasse1"}
        )
        # Regression : le cookie refresh doit avoir Path=/ (et non /auth/refresh)
        # pour etre renvoye derriere le prefixe de passerelle /api ; sinon le
        # navigateur n'enverrait jamais le cookie a /api/auth/refresh.
        set_cookie = login.headers["set-cookie"].lower()
        assert "path=/auth/refresh" not in set_cookie
        assert "path=/" in set_cookie
        # Le client httpx persiste le cookie pose par /auth/login (Path=/).
        response = await harness.client.post("/auth/refresh")

        assert response.status_code == 200
        assert response.json()["access_token"]

    async def test_refresh_sans_cookie_renvoie_401(self, harness: _AuthTestHarness) -> None:
        response = await harness.client.post("/auth/refresh")

        assert response.status_code == 401

    async def test_logout_invalide_le_refresh(self, harness: _AuthTestHarness) -> None:
        email = _unique_email("logout")
        await self._register(harness, email)
        login = await harness.client.post(
            "/auth/login", json={"email": email, "password": "motdepasse1"}
        )
        access = login.json()["access_token"]
        refresh_cookie = login.cookies["stacknest_refresh"]

        logout = await harness.client.post(
            "/auth/logout", headers={"Authorization": f"Bearer {access}"}
        )
        assert logout.status_code == 204

        # Le logout efface le cookie cote client : on re-injecte l'ancien refresh
        # pour verifier qu'il est desormais rejete (token_version bumpee).
        harness.client.cookies.set("stacknest_refresh", refresh_cookie, path="/")
        replay = await harness.client.post("/auth/refresh")
        assert replay.status_code == 401


class TestForgotReset:
    async def test_forgot_compte_existant_envoie_un_email(self, harness: _AuthTestHarness) -> None:
        email = _unique_email("forgot")
        await harness.client.post(
            "/auth/register", json={"email": email, "password": "motdepasse1"}
        )
        harness.emails.sent.clear()

        response = await harness.client.post("/auth/forgot", json={"email": email})

        assert response.status_code == 202
        assert len(harness.emails.sent) == 1

    async def test_forgot_compte_inconnu_reste_202_sans_email(
        self, harness: _AuthTestHarness
    ) -> None:
        response = await harness.client.post(
            "/auth/forgot", json={"email": "inconnu-xyz@stacknest.local"}
        )

        assert response.status_code == 202
        assert harness.emails.sent == []

    async def test_reset_change_le_mot_de_passe_et_invalide_le_token(
        self, harness: _AuthTestHarness
    ) -> None:
        email = _unique_email("reset")
        await harness.client.post("/auth/register", json={"email": email, "password": "ancienmdp1"})
        harness.emails.sent.clear()
        await harness.client.post("/auth/forgot", json={"email": email})
        token = _extract_token(harness.emails.sent[-1])

        reset = await harness.client.post(
            "/auth/reset", json={"token": token, "password": "nouveaumdp1"}
        )
        assert reset.status_code == 204

        # Le nouveau mot de passe fonctionne.
        login_ok = await harness.client.post(
            "/auth/login", json={"email": email, "password": "nouveaumdp1"}
        )
        assert login_ok.status_code == 200

        # Rejouer le meme token de reset echoue (single-use via bump version).
        replay = await harness.client.post(
            "/auth/reset", json={"token": token, "password": "encoreunmdp1"}
        )
        assert replay.status_code == 401


class TestRateLimit:
    async def test_login_bloque_renvoie_429(self) -> None:
        settings = Settings(jwt_secret=_SECRET, refresh_cookie_secure=False)
        app = create_app(settings)
        app.dependency_overrides[get_settings] = lambda: settings
        app.dependency_overrides[get_rate_limiter] = lambda: _BlockAllRateLimiter()

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="https://test") as client:
            response = await client.post(
                "/auth/login", json={"email": "x@stacknest.local", "password": "motdepasse1"}
            )

        assert response.status_code == 429
        assert response.json()["error"] == "RATE_LIMITED"
