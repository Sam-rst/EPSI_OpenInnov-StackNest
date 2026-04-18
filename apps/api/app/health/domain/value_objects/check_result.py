"""Value object representant le resultat d'un check de sante."""

from dataclasses import dataclass, field

from app.health.domain.enums.check_status import CheckStatus


@dataclass(frozen=True)
class CheckResult:
    """Resultat d'un check de sante d'un sous-service (DB, Redis, SMTP, ...).

    Immutable (frozen). Les guard clauses dans __post_init__ garantissent des
    invariants : nom non vide, duree >= 0.
    """

    name: str
    status: CheckStatus
    duration_ms: float
    details: dict[str, str] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.name:
            raise ValueError("CheckResult.name must not be empty")
        if self.duration_ms < 0:
            raise ValueError("CheckResult.duration_ms must be >= 0")
