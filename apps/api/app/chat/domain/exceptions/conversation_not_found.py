"""Exception metier : la conversation demandee n'existe pas (ou pas pour cet owner)."""

from app.shared.exceptions.domain_exception import DomainException


class ConversationNotFoundException(DomainException):
    """Levee quand un fil de discussion est introuvable par son identifiant.

    Couvre aussi le cas d'un fil existant mais n'appartenant pas a l'utilisateur
    (on ne divulgue pas son existence, cf. isolation par owner). Transformee en
    HTTP 404 Not Found par le handler global.
    """

    def __init__(self, message: str = "Conversation introuvable.") -> None:
        super().__init__(code="CONVERSATION_NOT_FOUND", message=message, http_status=404)
