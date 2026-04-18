"""Tests unitaires de la value object CheckResult.

CheckResult represente le resultat d'un check de sante d'un sous-service
(DB, Redis, SMTP, ...). Frozen dataclass avec guard clauses dans __post_init__.
"""

from dataclasses import FrozenInstanceError

import pytest

from app.health.domain.enums.check_status import CheckStatus
from app.health.domain.value_objects.check_result import CheckResult


class TestCheckResult:
    def test_holds_all_fields(self) -> None:
        result = CheckResult(
            name="db",
            status=CheckStatus.OK,
            duration_ms=12.5,
            details={"host": "localhost"},
        )
        assert result.name == "db"
        assert result.status is CheckStatus.OK
        assert result.duration_ms == 12.5
        assert result.details == {"host": "localhost"}

    def test_details_default_is_empty_dict(self) -> None:
        result = CheckResult(name="db", status=CheckStatus.OK, duration_ms=0.0)
        assert result.details == {}

    def test_rejects_empty_name(self) -> None:
        with pytest.raises(ValueError, match="name"):
            CheckResult(name="", status=CheckStatus.OK, duration_ms=0.0)

    def test_rejects_negative_duration(self) -> None:
        with pytest.raises(ValueError, match="duration_ms"):
            CheckResult(name="db", status=CheckStatus.OK, duration_ms=-1.0)

    def test_is_frozen(self) -> None:
        result = CheckResult(name="db", status=CheckStatus.OK, duration_ms=0.0)
        with pytest.raises(FrozenInstanceError):
            result.name = "other"  # type: ignore[misc]
