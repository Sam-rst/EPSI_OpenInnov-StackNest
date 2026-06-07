"""Exception de transport : trop de tentatives (rate limiting)."""

from app.shared.exceptions.domain_exception import DomainException


class RateLimitedException(DomainException):
    """Levee quand un client depasse le nombre de tentatives autorisees.

    Concern de transport (par IP, par endpoint) plutot que metier : elle vit
    donc dans la couche presentation. Transformee en HTTP 429 Too Many Requests
    par le handler global (format homogene `{ error, message }`).
    """

    def __init__(self, message: str = "Trop de tentatives. Reessayez plus tard.") -> None:
        super().__init__(code="RATE_LIMITED", message=message, http_status=429)
