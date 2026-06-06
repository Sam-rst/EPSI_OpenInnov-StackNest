"""Exception metier : l'adresse email est deja associee a un compte."""

from app.shared.exceptions.domain_exception import DomainException


class EmailAlreadyUsedException(DomainException):
    """Levee a l'inscription quand l'email est deja pris (contrainte d'unicite).

    Transformee en HTTP 409 Conflict par le handler global.
    """

    def __init__(self, message: str = "Cette adresse email est deja utilisee.") -> None:
        super().__init__(code="EMAIL_ALREADY_USED", message=message, http_status=409)
