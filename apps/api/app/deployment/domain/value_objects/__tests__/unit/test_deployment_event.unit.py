"""Tests unitaires du value object DeploymentEvent (event pub/sub SSE)."""

import pytest

from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.value_objects.deployment_event import DeploymentEvent


class TestDeploymentEventValide:
    def test_event_de_statut_minimal(self) -> None:
        event = DeploymentEvent(status=DeploymentStatus.PROVISIONING)

        assert event.status is DeploymentStatus.PROVISIONING
        assert event.message is None
        assert event.access_url is None
        assert event.secret is None

    def test_event_running_porte_acces_et_secret_une_fois(self) -> None:
        event = DeploymentEvent(
            status=DeploymentStatus.RUNNING,
            message="Ressource demarree.",
            access_url="10.0.0.5:32768",
            secret="s3cr3t",
        )

        assert event.access_url == "10.0.0.5:32768"
        assert event.secret == "s3cr3t"

    def test_est_immutable(self) -> None:
        event = DeploymentEvent(status=DeploymentStatus.STOPPED)

        with pytest.raises(Exception):  # noqa: B017 (FrozenInstanceError)
            event.status = DeploymentStatus.RUNNING  # type: ignore[misc]
