"""Resultat du use case GetGlobalHealth."""

from dataclasses import dataclass

from app.health.domain.enums.check_status import CheckStatus
from app.health.domain.value_objects.check_result import CheckResult


@dataclass(frozen=True)
class GlobalHealth:
    """Statut agrege de tous les sous-checks plus le detail de chacun.

    `status` vaut `OK` si **tous** les sous-checks sont OK (registre vide
    inclus), `DOWN` des qu'au moins un check est DOWN ou TIMEOUT.
    """

    status: CheckStatus
    checks: list[CheckResult]
