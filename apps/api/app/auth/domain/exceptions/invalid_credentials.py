"""Exception metier : identifiants de connexion invalides."""

from app.shared.exceptions.domain_exception import DomainException


class InvalidCredentialsException(DomainException):
    """Levee quand l'email est inconnu ou le mot de passe ne correspond pas.

    Message volontairement generique (ne pas reveler si l'email existe) pour
    ne pas faciliter l'enumeration de comptes.
    Transformee en HTTP 401 Unauthorized par le handler global.
    """

    def __init__(self, message: str = "Identifiants invalides.") -> None:
        super().__init__(code="INVALID_CREDENTIALS", message=message, http_status=401)
