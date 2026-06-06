"""Tests d'integration du router catalogue contre un Postgres reel.

Monte l'application FastAPI complete (via `create_app`), branche la session sur
un conteneur Postgres (testcontainers, schema applique par `alembic upgrade
head`) et exerce les endpoints via httpx ASGI. L'authentification utilise des
jetons reels mintes par `JwtTokenService` ; le depot d'utilisateurs (RBAC) est
remplace par un faux en memoire. Couvre la protection des routes (user/admin),
le round-trip GET liste/detail et le cycle CRUD admin.
"""

import time
from collections.abc import AsyncIterator, Iterator
from pathlib import Path
from uuid import UUID, uuid4

import httpx
import pytest
from alembic.config import Config
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from testcontainers.postgres import PostgresContainer

from alembic import command
from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.value_objects.email import Email
from app.auth.infrastructure.security.jwt_token_service import JwtTokenService
from app.auth.presentation.dependencies.current_user import (
    get_token_service,
    get_user_repository,
)
from app.core.database.request_session import get_request_session
from app.main import create_app

# integration/ -> __tests__/ -> routers/ -> presentation/ -> catalog/ -> app/ ->
# apps/api
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


@pytest.fixture(scope="module")
def postgres_container() -> Iterator[PostgresContainer]:
    container = PostgresContainer("postgres:16-alpine", driver="asyncpg")
    container.start()
    try:
        _wait_for_port(container, 5432)
        url = container.get_connection_url()
        config = Config(str(_API_ROOT / "alembic.ini"))
        config.set_main_option("script_location", str(_API_ROOT / "alembic"))
        config.set_main_option("sqlalchemy.url", url)
        command.upgrade(config, "head")
        yield container
    finally:
        container.stop()


class _FakeUserRepository:
    def __init__(self, users: list[User]) -> None:
        self._by_id = {str(user.id): user for user in users}

    async def get_by_id(self, user_id: object) -> User | None:
        return self._by_id.get(str(user_id))


def _make_user(role: UserRole = UserRole.USER) -> User:
    return User(
        id=uuid4(),
        email=Email("user@stacknest.local"),
        password_hash="$2b$12$hash",
        role=role,
        is_verified=True,
        token_version=0,
    )


def _mint(user: User) -> str:
    return JwtTokenService(secret=_SECRET).issue(
        subject=user.id,
        purpose=TokenPurpose.ACCESS,
        role=user.role,
        token_version=user.token_version,
        ttl_seconds=900,
    )


@pytest.fixture
async def client(
    postgres_container: PostgresContainer,
) -> AsyncIterator[tuple[httpx.AsyncClient, User, User]]:
    engine = create_async_engine(postgres_container.get_connection_url())
    factory = async_sessionmaker(bind=engine, expire_on_commit=False)

    async def _request_session() -> AsyncIterator[AsyncSession]:
        async with factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    user = _make_user(UserRole.USER)
    admin = _make_user(UserRole.ADMIN)
    repository = _FakeUserRepository([user, admin])

    app = create_app()
    app.dependency_overrides[get_request_session] = _request_session
    app.dependency_overrides[get_token_service] = lambda: JwtTokenService(secret=_SECRET)
    app.dependency_overrides[get_user_repository] = lambda: repository

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="https://test") as http:
        yield http, user, admin
    await engine.dispose()


def _auth(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {_mint(user)}"}


def _payload(slug: str = "postgresql-16") -> dict[str, object]:
    return {
        "slug": slug,
        "name": "PostgreSQL",
        "icon": "database",
        "category": "database",
        "provider": "Docker",
        "description": "Base relationnelle managee.",
        "popular": True,
        "tags": ["SQL"],
        "is_active": True,
        "versions": [{"version": "16", "is_default": True, "is_lts": False, "eol_date": None}],
        "params": [
            {
                "key": "db_name",
                "label": "Nom de la base",
                "type": "string",
                "required": True,
                "default_value": "app",
                "options": None,
                "order_index": 0,
            }
        ],
    }


async def _create(http: httpx.AsyncClient, admin: User, slug: str = "postgresql-16") -> UUID:
    response = await http.post("/catalog/templates", json=_payload(slug), headers=_auth(admin))
    assert response.status_code == 201, response.text
    return UUID(response.json()["id"])


class TestProtection:
    async def test_liste_sans_jeton_renvoie_401(
        self, client: tuple[httpx.AsyncClient, User, User]
    ) -> None:
        http, _user, _admin = client

        response = await http.get("/catalog/templates")

        assert response.status_code in (401, 403)

    async def test_create_par_un_user_standard_renvoie_403(
        self, client: tuple[httpx.AsyncClient, User, User]
    ) -> None:
        http, user, _admin = client

        response = await http.post("/catalog/templates", json=_payload(), headers=_auth(user))

        assert response.status_code == 403


class TestReadEndpoints:
    async def test_liste_avec_jeton_user_renvoie_200(
        self, client: tuple[httpx.AsyncClient, User, User]
    ) -> None:
        http, user, admin = client
        await _create(http, admin, slug="redis-7")

        response = await http.get("/catalog/templates", headers=_auth(user))

        assert response.status_code == 200
        assert any(item["slug"] == "redis-7" for item in response.json())

    async def test_detail_renvoie_versions_et_params(
        self, client: tuple[httpx.AsyncClient, User, User]
    ) -> None:
        http, user, admin = client
        template_id = await _create(http, admin, slug="minio")

        response = await http.get(f"/catalog/templates/{template_id}", headers=_auth(user))

        assert response.status_code == 200
        body = response.json()
        assert len(body["versions"]) == 1
        assert len(body["params"]) == 1

    async def test_detail_template_inconnu_renvoie_404(
        self, client: tuple[httpx.AsyncClient, User, User]
    ) -> None:
        http, user, _admin = client

        response = await http.get(f"/catalog/templates/{uuid4()}", headers=_auth(user))

        assert response.status_code == 404


class TestCrudAdmin:
    async def test_create_puis_update_puis_delete(
        self, client: tuple[httpx.AsyncClient, User, User]
    ) -> None:
        http, user, admin = client
        template_id = await _create(http, admin, slug="vault")

        update_payload = _payload(slug="vault")
        update_payload["name"] = "Vault renomme"
        updated = await http.put(
            f"/catalog/templates/{template_id}", json=update_payload, headers=_auth(admin)
        )
        assert updated.status_code == 200
        assert updated.json()["name"] == "Vault renomme"

        deleted = await http.delete(f"/catalog/templates/{template_id}", headers=_auth(admin))
        assert deleted.status_code == 204

        gone = await http.get(f"/catalog/templates/{template_id}", headers=_auth(user))
        assert gone.status_code == 404

    async def test_create_slug_duplique_renvoie_409(
        self, client: tuple[httpx.AsyncClient, User, User]
    ) -> None:
        http, _user, admin = client
        await _create(http, admin, slug="ollama")

        duplicate = await http.post(
            "/catalog/templates", json=_payload(slug="ollama"), headers=_auth(admin)
        )

        assert duplicate.status_code == 409
