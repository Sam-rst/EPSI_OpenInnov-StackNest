"""Exception metier : le template reference par le LLM est absent du catalogue."""

from app.shared.exceptions.domain_exception import DomainException


class UnknownTemplateException(DomainException):
    """Levee quand un appel d'outil reference un template hors catalogue.

    1re couche anti-hallucination (cf. design section 8) : la boite a outils est
    fermee, le modele ne peut referencer que des templates reels ; un id inconnu
    est rejete. Transformee en HTTP 404 Not Found par le handler global.
    """

    def __init__(self, message: str = "Template inconnu du catalogue.") -> None:
        super().__init__(code="UNKNOWN_TEMPLATE", message=message, http_status=404)
