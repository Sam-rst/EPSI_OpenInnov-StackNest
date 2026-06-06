"""Exception metier : acces refuse (autorisation insuffisante)."""

from app.shared.exceptions.domain_exception import DomainException


class ForbiddenException(DomainException):
    """Levee quand un utilisateur authentifie n'a pas les droits requis (RBAC).

    Distincte des exceptions d'authentification (401) : l'identite est connue
    mais le role est insuffisant. Transformee en HTTP 403 Forbidden par le
    handler global.
    """

    def __init__(self, message: str = "Acces reserve aux administrateurs.") -> None:
        super().__init__(code="FORBIDDEN", message=message, http_status=403)
