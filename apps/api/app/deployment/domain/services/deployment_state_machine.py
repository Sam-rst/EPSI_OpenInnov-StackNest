"""Service de domaine : machine a etats du cycle de vie d'un deploiement."""

from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.exceptions.invalid_deployment_state import (
    InvalidDeploymentStateException,
)

# Transitions nominales autorisees (cf. design section 7). `failed` est ajoute
# dynamiquement comme cible depuis tout etat non terminal (echec a toute etape).
_ALLOWED_TRANSITIONS: dict[DeploymentStatus, frozenset[DeploymentStatus]] = {
    DeploymentStatus.PENDING: frozenset({DeploymentStatus.PROVISIONING}),
    DeploymentStatus.PROVISIONING: frozenset({DeploymentStatus.RUNNING}),
    DeploymentStatus.RUNNING: frozenset({DeploymentStatus.STOPPED, DeploymentStatus.DESTROYING}),
    DeploymentStatus.STOPPED: frozenset({DeploymentStatus.RUNNING, DeploymentStatus.DESTROYING}),
    DeploymentStatus.DESTROYING: frozenset({DeploymentStatus.DESTROYED}),
    DeploymentStatus.DESTROYED: frozenset(),
    DeploymentStatus.FAILED: frozenset(),
}

# Etats terminaux : aucune transition sortante (y compris vers `failed`).
_TERMINAL_STATUSES = frozenset({DeploymentStatus.DESTROYED, DeploymentStatus.FAILED})


class DeploymentStateMachine:
    """Garde les transitions d'etat legales d'un deploiement.

    Source de verite de la machine a etats decrite dans le design (section 7).
    Utilisee par les use cases avant d'enfiler un job : refuse les transitions
    illegales en levant `InvalidDeploymentStateException` (HTTP 409). Sans etat
    propre : methodes de classe pures.
    """

    @classmethod
    def can_transition(cls, current: DeploymentStatus, target: DeploymentStatus) -> bool:
        """Vrai si passer de `current` a `target` est une transition autorisee."""
        if current in _TERMINAL_STATUSES:
            return False
        if target is DeploymentStatus.FAILED:
            return True
        return target in _ALLOWED_TRANSITIONS[current]

    @classmethod
    def ensure_can_transition(cls, current: DeploymentStatus, target: DeploymentStatus) -> None:
        """Leve `InvalidDeploymentStateException` si la transition est illegale."""
        if not cls.can_transition(current, target):
            raise InvalidDeploymentStateException(
                f"Transition {current.value} -> {target.value} interdite."
            )
