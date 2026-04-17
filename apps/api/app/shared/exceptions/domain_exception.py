"""Exception metier de base, mappee en HTTP par le handler global."""


class DomainException(Exception):
    """Exception metier porteuse d'un code, d'un message et d'un statut HTTP cible.

    Les features etendent cette classe (ex : TemplateNotFoundException) pour
    exprimer des erreurs metier. Le handler global les transforme en reponse
    HTTP { error: code, message }. Les use cases / routers ne devraient
    JAMAIS les attraper : try/except sur l'infra uniquement.
    """

    def __init__(self, code: str, message: str, http_status: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status
