"""Exception metier : l'action de chat demandee n'existe pas (ou pas pour cet owner)."""

from app.shared.exceptions.domain_exception import DomainException


class ChatActionNotFoundException(DomainException):
    """Levee quand une `ChatAction` est introuvable par son identifiant.

    Survient typiquement a la confirmation / au rejet d'une action expiree ou
    appartenant a un autre utilisateur (on ne divulgue pas son existence).
    Transformee en HTTP 404 Not Found par le handler global.
    """

    def __init__(self, message: str = "Action de chat introuvable.") -> None:
        super().__init__(code="CHAT_ACTION_NOT_FOUND", message=message, http_status=404)
