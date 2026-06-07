"""Exception metier : template introuvable pour un deploiement."""

from app.shared.exceptions.domain_exception import DomainException


class TemplateNotFoundForDeploymentException(DomainException):
    """Levee quand le template (ou sa version) demande au deploiement est absent.

    Couvre le template introuvable et la version inconnue (le port
    `TemplateProvisioningReader` renvoie `None` dans les deux cas). Transformee en
    HTTP 404 Not Found par le handler global. Distincte de l'exception catalogue
    pour respecter l'isolation du slice deploiement (il ne depend que de son port).
    """

    def __init__(self, message: str = "Template introuvable pour ce deploiement.") -> None:
        super().__init__(code="TEMPLATE_NOT_FOUND_FOR_DEPLOYMENT", message=message, http_status=404)
