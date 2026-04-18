"""Port (interface) pour un check de sante d'un sous-service."""

from abc import ABC, abstractmethod

from app.health.domain.value_objects.check_result import CheckResult


class HealthCheck(ABC):
    """Contrat qu'un sous-service (DB, Redis, SMTP, ...) doit implementer
    pour etre branche sur l'endpoint /health.

    Le `name` sert a la fois d'identifiant (dispatch `/health/{name}`) et
    de label dans la reponse agregee de `/health`.

    Implementations typiques (infrastructure/) :

    - `DatabaseHealthCheck(HealthCheck)` : `SELECT 1` sur la session SQLAlchemy
    - `RedisHealthCheck(HealthCheck)`    : `PING` sur le client Redis
    - `SmtpHealthCheck(HealthCheck)`     : handshake SMTP puis QUIT

    L'implementation **doit etre tolerante aux erreurs** : retourner un
    `CheckResult(status=DOWN, ...)` au lieu de lever une exception. C'est
    le use case qui decide du global OK/DOWN.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Identifiant unique du check (ex : `db`, `redis`, `smtp`)."""

    @abstractmethod
    async def check(self) -> CheckResult:
        """Execute le check et retourne son resultat."""
