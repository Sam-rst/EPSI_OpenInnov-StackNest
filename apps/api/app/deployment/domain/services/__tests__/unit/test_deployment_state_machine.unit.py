"""Tests unitaires de la machine a etats des deploiements (transitions autorisees)."""

import pytest

from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.exceptions.invalid_deployment_state import (
    InvalidDeploymentStateException,
)
from app.deployment.domain.services.deployment_state_machine import (
    DeploymentStateMachine,
)


class TestTransitionsAutorisees:
    @pytest.mark.parametrize(
        ("depuis", "vers"),
        [
            (DeploymentStatus.PENDING, DeploymentStatus.PROVISIONING),
            (DeploymentStatus.PROVISIONING, DeploymentStatus.RUNNING),
            (DeploymentStatus.RUNNING, DeploymentStatus.STOPPED),
            (DeploymentStatus.STOPPED, DeploymentStatus.RUNNING),
            (DeploymentStatus.RUNNING, DeploymentStatus.DESTROYING),
            (DeploymentStatus.STOPPED, DeploymentStatus.DESTROYING),
            (DeploymentStatus.DESTROYING, DeploymentStatus.DESTROYED),
            # failed est atteignable depuis toute etape non terminale.
            (DeploymentStatus.PENDING, DeploymentStatus.FAILED),
            (DeploymentStatus.PROVISIONING, DeploymentStatus.FAILED),
            (DeploymentStatus.RUNNING, DeploymentStatus.FAILED),
            (DeploymentStatus.DESTROYING, DeploymentStatus.FAILED),
        ],
    )
    def test_can_transition_vrai(self, depuis: DeploymentStatus, vers: DeploymentStatus) -> None:
        assert DeploymentStateMachine.can_transition(depuis, vers) is True

    @pytest.mark.parametrize(
        ("depuis", "vers"),
        [
            # On ne peut pas demarrer/arreter un deploiement detruit.
            (DeploymentStatus.DESTROYED, DeploymentStatus.RUNNING),
            (DeploymentStatus.DESTROYED, DeploymentStatus.DESTROYING),
            # Sauts d'etat illegaux.
            (DeploymentStatus.PENDING, DeploymentStatus.RUNNING),
            (DeploymentStatus.STOPPED, DeploymentStatus.PROVISIONING),
            (DeploymentStatus.RUNNING, DeploymentStatus.PENDING),
            # failed est terminal au sens cycle de vie : pas de redemarrage direct.
            (DeploymentStatus.FAILED, DeploymentStatus.RUNNING),
            # Pas de transition vers soi-meme.
            (DeploymentStatus.RUNNING, DeploymentStatus.RUNNING),
        ],
    )
    def test_can_transition_faux(self, depuis: DeploymentStatus, vers: DeploymentStatus) -> None:
        assert DeploymentStateMachine.can_transition(depuis, vers) is False


class TestEnsureTransition:
    def test_transition_valide_ne_leve_rien(self) -> None:
        DeploymentStateMachine.ensure_can_transition(
            DeploymentStatus.RUNNING, DeploymentStatus.STOPPED
        )

    def test_transition_invalide_leve_exception_409(self) -> None:
        with pytest.raises(InvalidDeploymentStateException) as exc_info:
            DeploymentStateMachine.ensure_can_transition(
                DeploymentStatus.DESTROYED, DeploymentStatus.RUNNING
            )

        assert exc_info.value.http_status == 409
