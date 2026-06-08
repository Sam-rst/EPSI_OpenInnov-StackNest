"""Exception metier : parametres de deploiement invalides au regard du template."""

from app.shared.exceptions.domain_exception import DomainException


class InvalidDeploymentParamsException(DomainException):
    """Levee quand les params saisis ne respectent pas le descripteur du template.

    Couvre un parametre requis manquant ou vide, et une valeur non conforme au
    type / aux choix declares par le template (entier attendu, valeur hors liste
    d'un `SELECT`...). Le message precise le parametre fautif. Transformee en
    HTTP 422 Unprocessable Entity par le handler global.
    """

    def __init__(self, message: str) -> None:
        super().__init__(code="INVALID_DEPLOYMENT_PARAMS", message=message, http_status=422)
