"""Tests d'integration des dependances RBAC (get_current_user, require_admin).

Monte une mini-app FastAPI avec deux routes protegees, puis appelle l'API via
httpx ASGI avec des jetons reels mintes par JwtTokenService. Le UserRepository
est remplace par un faux en memoire (la logique RBAC ne depend pas de la base).
"""

from typing import Annotated
from uuid import uuid4

import httpx
from fastapi import Depends, FastAPI

from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.value_objects.email import Email
from app.auth.infrastructure.security.jwt_token_service import JwtTokenService
from app.auth.presentation.dependencies.current_user import get_current_user, get_token_service
from app.auth.presentation.dependencies.require_admin import require_admin
from app.core.exception_handlers import register_exception_handlers

_SECRET = "secret-de-test-suffisamment-long-pour-hs256-32o"


class _FakeUserRepository:
    def __init__(self, users: dict[str, User]) -> None:
        self._by_id = {str(user.id): user for user in users.values()}

    async def get_by_id(self, user_id: object) -> User | None:
        return self._by_id.get(str(user_id))


def _build_app(users: list[User]) -> FastAPI:
    from app.auth.presentation.dependencies.current_user import get_user_repository

    repository = _FakeUserRepository({str(u.id): u for u in users})
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/me")
    async def me(current: Annotated[User, Depends(get_current_user)]) -> dict[str, str]:
        return {"id": str(current.id)}

    @app.get("/admin")
    async def admin(current: Annotated[User, Depends(require_admin)]) -> dict[str, str]:
        return {"id": str(current.id)}

    app.dependency_overrides[get_token_service] = lambda: JwtTokenService(secret=_SECRET)
    app.dependency_overrides[get_user_repository] = lambda: repository
    return app


def _make_user(role: UserRole = UserRole.USER, token_version: int = 0) -> User:
    return User(
        id=uuid4(),
        email=Email("user@stacknest.local"),
        password_hash="$2b$12$hash",
        role=role,
        is_verified=True,
        token_version=token_version,
    )


def _mint(user: User, *, token_version: int | None = None) -> str:
    service = JwtTokenService(secret=_SECRET)
    return service.issue(
        subject=user.id,
        purpose=TokenPurpose.ACCESS,
        role=user.role,
        token_version=user.token_version if token_version is None else token_version,
        ttl_seconds=900,
    )


async def _client(app: FastAPI) -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


class TestGetCurrentUser:
    async def test_jeton_valide_autorise_l_acces(self) -> None:
        user = _make_user()
        app = _build_app([user])

        async with await _client(app) as client:
            response = await client.get("/me", headers={"Authorization": f"Bearer {_mint(user)}"})

        assert response.status_code == 200
        assert response.json()["id"] == str(user.id)

    async def test_sans_jeton_renvoie_401(self) -> None:
        app = _build_app([_make_user()])

        async with await _client(app) as client:
            response = await client.get("/me")

        assert response.status_code in (401, 403)

    async def test_token_version_perimee_renvoie_401(self) -> None:
        user = _make_user(token_version=5)
        app = _build_app([user])
        # Jeton emis avec une version differente de celle du user en base.
        token = _mint(user, token_version=4)

        async with await _client(app) as client:
            response = await client.get("/me", headers={"Authorization": f"Bearer {token}"})

        assert response.status_code == 401

    async def test_utilisateur_inconnu_renvoie_401(self) -> None:
        absent = _make_user()
        app = _build_app([])  # repository vide

        async with await _client(app) as client:
            response = await client.get("/me", headers={"Authorization": f"Bearer {_mint(absent)}"})

        assert response.status_code == 401


class TestRequireAdmin:
    async def test_admin_autorise(self) -> None:
        admin = _make_user(role=UserRole.ADMIN)
        app = _build_app([admin])

        async with await _client(app) as client:
            response = await client.get(
                "/admin", headers={"Authorization": f"Bearer {_mint(admin)}"}
            )

        assert response.status_code == 200

    async def test_user_standard_renvoie_403(self) -> None:
        user = _make_user(role=UserRole.USER)
        app = _build_app([user])

        async with await _client(app) as client:
            response = await client.get(
                "/admin", headers={"Authorization": f"Bearer {_mint(user)}"}
            )

        assert response.status_code == 403
