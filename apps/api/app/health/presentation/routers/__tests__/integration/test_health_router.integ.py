"""Tests d'integration du router /health.

Couvre :
- GET /health avec registre vide -> 200, status OK, checks vide, version info
- GET /health avec 1 check OK -> 200, status OK, detail du check
- GET /health avec 1 check DOWN -> 503, status DOWN
- GET /health/{name} avec nom inconnu -> 404
- GET /health/{name} avec check enregistre -> 200, detail du check

Les HealthCheck sont injectes via dependency_overrides (pattern FastAPI
officiel). Settings de test injecte aussi via override.
"""

from collections.abc import AsyncIterator, Callable

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings, get_settings
from app.health.application.ports.health_check import HealthCheck
from app.health.domain.enums.check_status import CheckStatus
from app.health.domain.value_objects.check_result import CheckResult
from app.health.presentation.dependencies.health_checks import get_health_checks
from app.main import app

# Factory fournie par la fixture : prend la liste des HealthCheck a injecter
# et renvoie un AsyncIterator[AsyncClient] (bootstrap + teardown via yield).
ClientFactory = Callable[[list[HealthCheck]], AsyncIterator[AsyncClient]]


class _StubCheck(HealthCheck):
    def __init__(self, name: str, status: CheckStatus) -> None:
        self._name = name
        self._status = status

    @property
    def name(self) -> str:
        return self._name

    async def check(self) -> CheckResult:
        return CheckResult(name=self._name, status=self._status, duration_ms=1.0)


@pytest.fixture
def fixed_settings() -> Settings:
    return Settings(
        app_version="0.1.0",
        git_commit="abc1234",
        app_env="test",
        deployed_at="2026-04-18T12:00:00Z",
    )


@pytest.fixture
def client_factory(fixed_settings: Settings) -> ClientFactory:
    """Factory qui retourne un client HTTP avec un registre de checks injecte."""

    async def _make(checks: list[HealthCheck]) -> AsyncIterator[AsyncClient]:
        app.dependency_overrides[get_settings] = lambda: fixed_settings
        app.dependency_overrides[get_health_checks] = lambda: checks
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
        app.dependency_overrides.clear()

    return _make


class TestGlobalHealth:
    async def test_returns_200_with_empty_checks_when_registry_is_empty(
        self, client_factory: ClientFactory
    ) -> None:
        async for client in client_factory([]):
            response = await client.get("/health")

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["version"] == "0.1.0"
        assert body["env"] == "test"
        assert body["deployed_at"] == "2026-04-18T12:00:00Z"
        assert body["checks"] == []

    async def test_returns_200_when_all_registered_checks_are_ok(
        self, client_factory: ClientFactory
    ) -> None:
        async for client in client_factory([_StubCheck(name="db", status=CheckStatus.OK)]):
            response = await client.get("/health")

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert len(body["checks"]) == 1
        assert body["checks"][0]["name"] == "db"
        assert body["checks"][0]["status"] == "ok"

    async def test_returns_503_when_any_check_is_down(self, client_factory: ClientFactory) -> None:
        async for client in client_factory(
            [
                _StubCheck(name="db", status=CheckStatus.OK),
                _StubCheck(name="redis", status=CheckStatus.DOWN),
            ]
        ):
            response = await client.get("/health")

        assert response.status_code == 503
        body = response.json()
        assert body["status"] == "down"
        statuses = {c["name"]: c["status"] for c in body["checks"]}
        assert statuses == {"db": "ok", "redis": "down"}


class TestSingleCheck:
    async def test_returns_404_for_unknown_check_name(self, client_factory: ClientFactory) -> None:
        async for client in client_factory([_StubCheck(name="db", status=CheckStatus.OK)]):
            response = await client.get("/health/unknown")

        assert response.status_code == 404
        body = response.json()
        assert body["error"] == "HEALTH_CHECK_NOT_FOUND"
        assert "unknown" in body["message"]

    async def test_returns_200_with_check_detail_when_registered(
        self, client_factory: ClientFactory
    ) -> None:
        async for client in client_factory([_StubCheck(name="db", status=CheckStatus.OK)]):
            response = await client.get("/health/db")

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "db"
        assert body["status"] == "ok"
        assert "duration_ms" in body

    async def test_returns_503_when_single_check_is_down(
        self, client_factory: ClientFactory
    ) -> None:
        async for client in client_factory([_StubCheck(name="redis", status=CheckStatus.DOWN)]):
            response = await client.get("/health/redis")

        assert response.status_code == 503
        body = response.json()
        assert body["name"] == "redis"
        assert body["status"] == "down"
