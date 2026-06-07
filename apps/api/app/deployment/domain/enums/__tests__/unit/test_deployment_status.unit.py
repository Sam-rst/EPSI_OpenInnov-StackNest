"""Tests unitaires de l'enum DeploymentStatus (valeurs + serialisation)."""

from app.deployment.domain.enums.deployment_status import DeploymentStatus


class TestDeploymentStatusValeurs:
    def test_toutes_les_valeurs_attendues_existent(self) -> None:
        assert {statut.value for statut in DeploymentStatus} == {
            "pending",
            "provisioning",
            "running",
            "stopped",
            "failed",
            "destroying",
            "destroyed",
        }

    def test_serialise_directement_en_chaine(self) -> None:
        assert DeploymentStatus.RUNNING == "running"
        assert f"{DeploymentStatus.PENDING}" == "pending"
