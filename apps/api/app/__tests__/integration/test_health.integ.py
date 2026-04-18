"""Test d'integration pour l'endpoint /health.

CA4 (partie 1) : `GET /health` retourne 200 avec body `{"status": "ok"}`.
Niveau integration car le test traverse le pipeline ASGI FastAPI
(routing, serialisation JSON) via `httpx.ASGITransport`.
"""

from httpx import ASGITransport, AsyncClient

from app.main import app


class TestHealthEndpoint:
    async def test_returns_200_with_status_ok(self) -> None:
        """Etant donne l'app FastAPI, quand on appelle GET /health, alors 200 + {status: ok}."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
