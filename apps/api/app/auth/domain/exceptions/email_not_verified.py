"""Exception metier : l'adresse email n'a pas ete verifiee."""

from app.shared.exceptions.domain_exception import DomainException


class EmailNotVerifiedException(DomainException):
    """Levee a la connexion quand la verification d'email est exigee
    (`auth_require_email_verification=True`) mais que le compte n'est pas
    encore verifie (`is_verified=False`).

    Transformee en HTTP 403 Forbidden par le handler global.
    """

    def __init__(self, message: str = "Adresse email non verifiee.") -> None:
        super().__init__(code="EMAIL_NOT_VERIFIED", message=message, http_status=403)
