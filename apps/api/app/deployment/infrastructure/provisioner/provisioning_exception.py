"""Exception infrastructure : une operation de provisioning Docker a echoue."""

from app.shared.exceptions.domain_exception import DomainException


class ProvisioningException(DomainException):
    """Levee quand le `DockerSdkProvisioner` ne peut pas mener une operation a bien.

    Causes typiques :

    - Demon Docker injoignable (hote d'execution down, SSH coupe)
    - Image introuvable / pull refuse par le registre
    - Conteneur absent lors d'un start/stop/destroy/logs
    - Port attendu non publie par Docker apres le run

    Releve de la politique `try/except sur infrastructure uniquement` : toute
    erreur docker-py / reseau est convertie en `ProvisioningException` avec la
    cause originale preservee via `raise ... from err`. Transformee en HTTP 502
    Bad Gateway `{ error: PROVISIONING_FAILED, message }` par le handler global
    si elle remonte jusqu'a une requete ; cote worker, elle fait basculer le
    deploiement en statut `failed`.
    """

    def __init__(self, message: str) -> None:
        super().__init__(
            code="PROVISIONING_FAILED",
            message=message,
            http_status=502,
        )
