"""Exception metier : le slug est deja porte par un autre template."""

from app.shared.exceptions.domain_exception import DomainException


class SlugAlreadyUsedException(DomainException):
    """Levee a la creation/mise a jour quand le slug viole l'unicite.

    Transformee en HTTP 409 Conflict par le handler global.
    """

    def __init__(self, message: str = "Ce slug est deja utilise.") -> None:
        super().__init__(code="SLUG_ALREADY_USED", message=message, http_status=409)
