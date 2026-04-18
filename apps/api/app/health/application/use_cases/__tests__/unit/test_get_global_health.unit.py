"""Tests unitaires du use case GetGlobalHealth.

Agrege les resultats de N HealthCheck en parallele :
- Aucun check enregistre -> OK, liste vide
- Tous les sous-checks OK -> status OK
- Au moins un DOWN        -> status DOWN
- Timeout global depasse  -> tous marques TIMEOUT, status DOWN

Le use case prend des HealthCheck mockes (pas de vraie DB / Redis ici).
"""

import asyncio

from app.health.application.ports.health_check import HealthCheck
from app.health.application.use_cases.get_global_health import GetGlobalHealth
from app.health.domain.enums.check_status import CheckStatus
from app.health.domain.value_objects.check_result import CheckResult


class _StubCheck(HealthCheck):
    """Stub pour simuler un HealthCheck dans les tests unitaires."""

    def __init__(self, name: str, status: CheckStatus, sleep_seconds: float = 0.0) -> None:
        self._name = name
        self._status = status
        self._sleep_seconds = sleep_seconds

    @property
    def name(self) -> str:
        return self._name

    async def check(self) -> CheckResult:
        if self._sleep_seconds > 0:
            await asyncio.sleep(self._sleep_seconds)
        return CheckResult(name=self._name, status=self._status, duration_ms=0.0)


class TestGetGlobalHealth:
    async def test_returns_ok_with_empty_checks_when_no_registration(self) -> None:
        """Etant donne aucun check enregistre, quand on execute, alors status OK + liste vide."""
        use_case = GetGlobalHealth(checks=[])

        result = await use_case.execute()

        assert result.status is CheckStatus.OK
        assert result.checks == []

    async def test_returns_ok_when_all_checks_are_ok(self) -> None:
        """Etant donne 2 checks OK, quand on execute, alors status global OK."""
        use_case = GetGlobalHealth(
            checks=[
                _StubCheck(name="db", status=CheckStatus.OK),
                _StubCheck(name="redis", status=CheckStatus.OK),
            ]
        )

        result = await use_case.execute()

        assert result.status is CheckStatus.OK
        assert {c.name for c in result.checks} == {"db", "redis"}
        assert all(c.status is CheckStatus.OK for c in result.checks)

    async def test_returns_down_when_at_least_one_check_is_down(self) -> None:
        """Etant donne 1 check OK + 1 DOWN, quand on execute, alors status global DOWN."""
        use_case = GetGlobalHealth(
            checks=[
                _StubCheck(name="db", status=CheckStatus.OK),
                _StubCheck(name="redis", status=CheckStatus.DOWN),
            ]
        )

        result = await use_case.execute()

        assert result.status is CheckStatus.DOWN
        statuses = {c.name: c.status for c in result.checks}
        assert statuses == {"db": CheckStatus.OK, "redis": CheckStatus.DOWN}

    async def test_marks_all_as_timeout_when_global_deadline_exceeded(self) -> None:
        """Etant donne un check lent (2s) avec timeout 0.05s, quand on execute,
        alors tous les sous-checks sont marques TIMEOUT et le status global est DOWN."""
        use_case = GetGlobalHealth(
            checks=[
                _StubCheck(name="slow", status=CheckStatus.OK, sleep_seconds=2.0),
            ],
            timeout_seconds=0.05,
        )

        result = await use_case.execute()

        assert result.status is CheckStatus.DOWN
        assert len(result.checks) == 1
        assert result.checks[0].name == "slow"
        assert result.checks[0].status is CheckStatus.TIMEOUT
