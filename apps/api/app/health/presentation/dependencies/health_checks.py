"""Provider FastAPI du registre de HealthCheck.

Retourne la liste des `HealthCheck` a interroger pour `GET /health` et a
dispatcher pour `GET /health/{name}`. Initialement vide — les tickets
suivants (STN-19 DB, STN-20 Redis, ...) ajouteront leurs implementations
ici au fur et a mesure.

Les tests injectent leur propre liste via `app.dependency_overrides`.
"""

from app.health.application.ports.health_check import HealthCheck


def get_health_checks() -> list[HealthCheck]:
    """Registre des checks de sante actifs (vide par defaut en v0.1.0)."""
    return []
