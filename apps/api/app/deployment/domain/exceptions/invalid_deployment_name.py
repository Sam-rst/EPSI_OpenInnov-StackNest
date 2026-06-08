"""Exception metier : nom de deploiement au format invalide."""

from app.shared.exceptions.domain_exception import DomainException


class InvalidDeploymentNameException(DomainException):
    """Levee quand le nom saisi ne respecte pas le format type label DNS.

    Le nom d'un deploiement sert d'identifiant lisible et de base au nom du
    conteneur : il doit etre un label DNS (minuscules, chiffres, tirets internes,
    1 a 63 caracteres, ni tiret en tete/fin). Un nom invalide (`Ma Base!`,
    espaces, majuscules...) est refuse a la creation. Transformee en HTTP 422
    Unprocessable Entity par le handler global.
    """

    def __init__(
        self,
        message: str = (
            "Le nom doit etre en minuscules : lettres, chiffres et tirets internes "
            "uniquement (1 a 63 caracteres, sans tiret en debut ou fin)."
        ),
    ) -> None:
        super().__init__(code="INVALID_DEPLOYMENT_NAME", message=message, http_status=422)
