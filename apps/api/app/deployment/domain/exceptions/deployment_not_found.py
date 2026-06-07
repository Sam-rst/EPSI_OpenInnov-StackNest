"""Exception metier : le deploiement demande n'existe pas (ou pas pour cet owner)."""

from app.shared.exceptions.domain_exception import DomainException


class DeploymentNotFoundException(DomainException):
    """Levee quand un deploiement est introuvable par son identifiant.

    Couvre aussi le cas d'un deploiement existant mais n'appartenant pas a
    l'utilisateur (on ne divulgue pas son existence). Transformee en HTTP 404
    Not Found par le handler global.
    """

    def __init__(self, message: str = "Deploiement introuvable.") -> None:
        super().__init__(code="DEPLOYMENT_NOT_FOUND", message=message, http_status=404)
