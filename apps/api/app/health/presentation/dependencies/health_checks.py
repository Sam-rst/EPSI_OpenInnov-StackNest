"""Provider FastAPI du registre de HealthCheck.

Retourne la liste des `HealthCheck` a interroger pour `GET /health` et a
dispatcher pour `GET /health/{name}`. STN-160 y branche le check DB ;
les tickets suivants (Redis, SMTP, ...) ajouteront leurs implementations
ici au fur et a mesure.

Les tests injectent leur propre liste via `app.dependency_overrides`.
"""

from app.core.database.engine import get_sessionmaker
from app.health.application.ports.health_check import HealthCheck
from app.health.infrastructure.database_health_check import DatabaseHealthCheck


def get_health_checks() -> list[HealthCheck]:
    """Registre des checks de sante actifs (DB en v0.1.0)."""
    return [DatabaseHealthCheck(session_factory=get_sessionmaker())]
