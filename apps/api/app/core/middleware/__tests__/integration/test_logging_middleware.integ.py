"""Test d'integration du middleware de logging structure.

CA5 : a chaque requete HTTP, un log JSON est emis avec
method, path, status, duration_ms (via structlog).

Niveau integration car le test traverse le pipeline ASGI complet
(middleware -> route -> response) via `httpx.ASGITransport`.
On capture les logs via `structlog.testing.capture_logs` (API officielle).
"""

import structlog
from httpx import ASGITransport, AsyncClient

from app.health.presentation.dependencies.health_checks import get_health_checks
from app.main import app


class TestLoggingMiddleware:
    async def test_emits_structured_log_per_request(self) -> None:
        """Etant donne l'app, quand on appelle GET /health, alors un log JSON
        contient method=GET, path=/health, status=200, duration_ms (numerique)."""
        # Ce test cible le MIDDLEWARE, pas la sante : on neutralise le registre
        # de checks (qui contient desormais le check DB reel) pour obtenir un
        # 200 deterministe sans dependre d'un Postgres en local.
        app.dependency_overrides[get_health_checks] = lambda: []
        transport = ASGITransport(app=app)
        try:
            with structlog.testing.capture_logs() as captured:
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    response = await client.get("/health")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200

        request_logs = [log for log in captured if log.get("event") == "http_request"]
        assert len(request_logs) == 1, f"expected 1 http_request log, got {captured}"

        log = request_logs[0]
        assert log["method"] == "GET"
        assert log["path"] == "/health"
        assert log["status"] == 200
        assert isinstance(log["duration_ms"], (int, float))
        assert log["duration_ms"] >= 0
