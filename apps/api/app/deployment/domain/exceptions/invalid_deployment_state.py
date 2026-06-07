"""Exception metier : transition d'etat illegale sur un deploiement."""

from app.shared.exceptions.domain_exception import DomainException


class InvalidDeploymentStateException(DomainException):
    """Levee quand une action est demandee depuis un etat incompatible.

    Exemples : demarrer un deploiement detruit, arreter un deploiement deja
    arrete. La machine a etats (`DeploymentStateMachine`) refuse la transition.
    Transformee en HTTP 409 Conflict par le handler global.
    """

    def __init__(self, message: str = "Transition d'etat invalide.") -> None:
        super().__init__(code="INVALID_DEPLOYMENT_STATE", message=message, http_status=409)
