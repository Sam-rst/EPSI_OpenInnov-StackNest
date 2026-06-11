"""Exception metier : la stack demandee n'existe pas (ou pas pour cet owner)."""

from app.shared.exceptions.domain_exception import DomainException


class StackNotFoundException(DomainException):
    """Levee quand une stack est introuvable par son identifiant.

    Couvre aussi le cas d'une stack existante mais n'appartenant pas a
    l'utilisateur (on ne divulgue pas son existence). Transformee en HTTP 404
    Not Found par le handler global.
    """

    def __init__(self, message: str = "Stack introuvable.") -> None:
        super().__init__(code="STACK_NOT_FOUND", message=message, http_status=404)
