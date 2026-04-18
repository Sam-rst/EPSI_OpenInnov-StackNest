"""Test d'integration pour l'endpoint /version.

CA4 (partie 2) : `GET /version` retourne 200 avec body
`{ version, commit, env, deployed_at }`.

Niveau integration car le test traverse le pipeline ASGI FastAPI
(routing, serialisation JSON, injection de dependances) via
`httpx.ASGITransport`. On injecte un Settings de test via
`app.dependency_overrides` — pattern FastAPI officiel, pas de mutation
d'etat global (lru_cache) ni d'import tardif.
"""

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings, get_settings
from app.main import app


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """Client HTTP ASGI avec un Settings de test injecte via dependency_overrides."""
    app.dependency_overrides[get_settings] = lambda: Settings(
        app_version="0.1.0",
        git_commit="abc1234",
        app_env="test",
        deployed_at="2026-04-17T12:00:00Z",
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


class TestVersionEndpoint:
    async def test_returns_200_with_build_metadata(self, client: AsyncClient) -> None:
        """Etant donne un Settings de test injecte, quand on appelle GET /version,
        alors 200 + body avec les 4 champs version/commit/env/deployed_at."""
        response = await client.get("/version")

        assert response.status_code == 200
        assert response.json() == {
            "version": "0.1.0",
            "commit": "abc1234",
            "env": "test",
            "deployed_at": "2026-04-17T12:00:00Z",
        }
