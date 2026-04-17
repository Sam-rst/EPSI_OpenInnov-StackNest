"""Test d'integration pour l'endpoint /version.

CA4 (partie 2) : `GET /version` retourne 200 avec body
`{ version, commit, env, deployed_at }`.

Niveau integration car le test traverse le pipeline ASGI FastAPI
(routing, serialisation JSON) via `httpx.ASGITransport`.
Les valeurs sont lues depuis les env vars via pydantic-settings ;
on les force via monkeypatch pour rendre le test deterministe.
"""

import pytest
from httpx import ASGITransport, AsyncClient


class TestVersionEndpoint:
    async def test_returns_200_with_build_metadata(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Etant donne APP_VERSION/GIT_COMMIT/APP_ENV/DEPLOYED_AT positionnes,
        quand on appelle GET /version, alors 200 + body avec ces 4 champs."""
        monkeypatch.setenv("APP_VERSION", "0.1.0")
        monkeypatch.setenv("GIT_COMMIT", "abc1234")
        monkeypatch.setenv("APP_ENV", "test")
        monkeypatch.setenv("DEPLOYED_AT", "2026-04-17T12:00:00Z")

        # Import apres monkeypatch pour que Settings lise les env vars patchees
        from app.core.config import get_settings

        get_settings.cache_clear()

        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/version")

        assert response.status_code == 200
        assert response.json() == {
            "version": "0.1.0",
            "commit": "abc1234",
            "env": "test",
            "deployed_at": "2026-04-17T12:00:00Z",
        }
