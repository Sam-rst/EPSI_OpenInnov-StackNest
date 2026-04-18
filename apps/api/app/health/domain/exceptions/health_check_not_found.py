"""Exception metier : un HealthCheck demande par nom n'est pas enregistre."""

from app.shared.exceptions.domain_exception import DomainException


class HealthCheckNotFoundException(DomainException):
    """Levee quand `GET /health/{name}` cible un check inconnu.

    Transformee en HTTP 404 `{ error: HEALTH_CHECK_NOT_FOUND, message }`
    par le handler global.
    """

    def __init__(self, name: str) -> None:
        super().__init__(
            code="HEALTH_CHECK_NOT_FOUND",
            message=f"Aucun health check enregistre pour '{name}'",
            http_status=404,
        )
