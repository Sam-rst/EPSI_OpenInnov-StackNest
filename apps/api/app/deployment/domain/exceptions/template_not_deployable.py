"""Exception metier : template visible au catalogue mais non deployable au MVP."""

from app.shared.exceptions.domain_exception import DomainException


class TemplateNotDeployableException(DomainException):
    """Levee quand un template marque `is_deployable=False` est demande au deploiement.

    Certains templates restent visibles dans le catalogue (etiquette « Bientot
    disponible ») mais ne sont pas deployables : un runtime langage (Node, Python,
    Go, PHP) n'expose aucun service long-running utile au MVP. Tenter de les
    deployer leve cette exception, transformee en HTTP 409 Conflict par le handler
    global (meme statut que la gate moteur Terraform).
    """

    def __init__(self, message: str = "Deploiement bientot disponible.") -> None:
        super().__init__(code="TEMPLATE_NOT_DEPLOYABLE", message=message, http_status=409)
