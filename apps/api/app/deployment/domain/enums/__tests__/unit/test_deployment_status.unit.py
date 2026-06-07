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
        # StrEnum : la valeur se serialise directement en chaine.
        assert DeploymentStatus.RUNNING.value == "running"
        assert str(DeploymentStatus.PENDING) == "pending"
