"""Exception metier : le template demande n'existe pas."""

from app.shared.exceptions.domain_exception import DomainException


class TemplateNotFoundException(DomainException):
    """Levee quand un template est introuvable par son identifiant.

    Transformee en HTTP 404 Not Found par le handler global.
    """

    def __init__(self, message: str = "Template introuvable.") -> None:
        super().__init__(code="TEMPLATE_NOT_FOUND", message=message, http_status=404)
