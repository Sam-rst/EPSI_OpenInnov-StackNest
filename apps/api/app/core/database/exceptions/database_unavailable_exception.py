"""Exception d'infrastructure : la base de donnees est injoignable."""

from app.shared.exceptions.domain_exception import DomainException


class DatabaseUnavailableException(DomainException):
    """Levee quand un acces base echoue au niveau infrastructure.

    Causes typiques :

    - Postgres down ou injoignable (connexion refusee, hote inconnu)
    - Timeout reseau / pool epuise
    - Erreur driver asyncpg lors d'un `SELECT 1`

    Transformee en HTTP 503 Service Unavailable
    `{ error: DATABASE_UNAVAILABLE, message }` par le handler global. Releve
    de la politique `try/except sur infrastructure uniquement` : la cause
    originale est preservee via `raise ... from err` au site d'appel.
    """

    def __init__(self, message: str) -> None:
        super().__init__(
            code="DATABASE_UNAVAILABLE",
            message=message,
            http_status=503,
        )
