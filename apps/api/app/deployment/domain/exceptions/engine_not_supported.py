"""Exception metier : moteur de provisioning non supporte au MVP."""

from app.shared.exceptions.domain_exception import DomainException


class EngineNotSupportedException(DomainException):
    """Levee quand un template demande un moteur non deployable au MVP.

    Seuls les templates `engine == docker` sont provisionnables (cf. design
    section 12) : un template `terraform` declenche cette exception, transformee
    en HTTP 409 Conflict par le handler global. Le message par defaut signale au
    client que le support Terraform est a venir.
    """

    def __init__(self, message: str = "Deploiement Terraform a venir.") -> None:
        super().__init__(code="ENGINE_NOT_SUPPORTED", message=message, http_status=409)
