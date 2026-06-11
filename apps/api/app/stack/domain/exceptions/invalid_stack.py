"""Exception metier : composition de stack invalide (alias, liens, cycle...)."""

from app.shared.exceptions.domain_exception import DomainException


class InvalidStackException(DomainException):
    """Levee quand la composition d'une stack viole une regle metier.

    Couvre toutes les regles structurelles validees par le `StackValidator` avant
    persistance : aucun service, alias vide ou duplique, lien vers un alias
    inconnu, lien d'un service vers lui-meme, ou cycle dans le graphe des liens.
    Le message precise la regle enfreinte. Transformee en HTTP 422 Unprocessable
    Entity par le handler global (aucune stack invalide n'est persistee).
    """

    def __init__(self, message: str) -> None:
        super().__init__(code="INVALID_STACK", message=message, http_status=422)
