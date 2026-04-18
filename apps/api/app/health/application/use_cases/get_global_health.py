"""Use case : execute tous les HealthCheck et agrege leurs resultats."""

import asyncio
from collections.abc import Iterable

from app.health.application.ports.health_check import HealthCheck
from app.health.application.results.global_health import GlobalHealth
from app.health.domain.enums.check_status import CheckStatus
from app.health.domain.value_objects.check_result import CheckResult


class GetGlobalHealth:
    """Agrege les resultats de N HealthCheck en parallele, avec timeout global.

    - Pas de check enregistre -> OK + liste vide (etat 'empty' considere sain)
    - Tous OK                  -> OK
    - Au moins un non-OK       -> DOWN
    - Deadline depassee        -> tous les checks marques TIMEOUT, global DOWN
    """

    DEFAULT_TIMEOUT_SECONDS = 2.0

    def __init__(
        self,
        checks: Iterable[HealthCheck],
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
    ) -> None:
        self._checks = list(checks)
        self._timeout_seconds = timeout_seconds

    async def execute(self) -> GlobalHealth:
        if not self._checks:
            return GlobalHealth(status=CheckStatus.OK, checks=[])

        try:
            results = await asyncio.wait_for(
                asyncio.gather(*(check.check() for check in self._checks)),
                timeout=self._timeout_seconds,
            )
        except TimeoutError:
            timeout_ms = self._timeout_seconds * 1000
            results = [
                CheckResult(name=check.name, status=CheckStatus.TIMEOUT, duration_ms=timeout_ms)
                for check in self._checks
            ]

        all_ok = all(r.status is CheckStatus.OK for r in results)
        global_status = CheckStatus.OK if all_ok else CheckStatus.DOWN
        return GlobalHealth(status=global_status, checks=list(results))
