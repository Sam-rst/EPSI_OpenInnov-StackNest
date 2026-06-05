"""Tests unitaires du registre par defaut des HealthCheck."""

from app.health.infrastructure.database_health_check import DatabaseHealthCheck
from app.health.presentation.dependencies.health_checks import get_health_checks


class TestHealthChecksRegistry:
    def test_enregistre_le_check_db_par_defaut(self) -> None:
        checks = get_health_checks()

        assert any(isinstance(check, DatabaseHealthCheck) for check in checks)
        assert {check.name for check in checks} == {"db"}
