"""Exception metier : un jeton JWT a expire (claim `exp` depasse)."""

from app.shared.exceptions.domain_exception import DomainException


class TokenExpiredException(DomainException):
    """Levee quand le claim `exp` d'un JWT est depasse.

    Distincte d'InvalidTokenException pour permettre au client de declencher
    un rafraichissement (refresh token) plutot qu'une deconnexion.
    Transformee en HTTP 401 Unauthorized par le handler global.
    """

    def __init__(self, message: str = "Jeton expire.") -> None:
        super().__init__(code="TOKEN_EXPIRED", message=message, http_status=401)
