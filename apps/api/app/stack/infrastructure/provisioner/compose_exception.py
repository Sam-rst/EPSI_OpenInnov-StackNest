"""Exception infrastructure : une operation `docker compose` a echoue."""

from app.shared.exceptions.domain_exception import DomainException


class ComposeException(DomainException):
    """Levee quand le `ComposeCliProvisioner` ne peut pas mener une operation a bien.

    Causes typiques :

    - Demon Docker injoignable (socket non monte, hote down)
    - `docker compose up` qui echoue (image introuvable, conflit de port)
    - `docker compose down` qui echoue
    - Sortie `docker compose ps` illisible

    Releve de la politique `try/except sur infrastructure uniquement` : toute
    erreur du sous-process est convertie en `ComposeException`. Cote worker, elle
    fait basculer la stack en statut `failed` (le handler ne la laisse pas
    remonter).
    """

    def __init__(self, message: str) -> None:
        super().__init__(
            code="COMPOSE_FAILED",
            message=message,
            http_status=502,
        )
