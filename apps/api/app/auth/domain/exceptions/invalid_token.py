"""Exception metier : un jeton JWT est invalide (signature, format, claims)."""

from app.shared.exceptions.domain_exception import DomainException


class InvalidTokenException(DomainException):
    """Levee quand un JWT est rejete : signature invalide, payload malforme,
    `purpose` inattendu ou `token_version` perimee (revocation).

    Transformee en HTTP 401 Unauthorized par le handler global.
    """

    def __init__(self, message: str = "Jeton invalide.") -> None:
        super().__init__(code="INVALID_TOKEN", message=message, http_status=401)
