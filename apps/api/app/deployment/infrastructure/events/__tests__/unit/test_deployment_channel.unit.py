"""Tests unitaires du nommage du canal pub/sub d'un deploiement."""

from uuid import UUID

from app.deployment.infrastructure.events.deployment_channel import deployment_channel


class TestDeploymentChannel:
    def test_construit_le_canal_prefixe_par_l_id(self) -> None:
        deployment_id = UUID("11111111-1111-1111-1111-111111111111")

        assert deployment_channel(deployment_id) == (
            "deployment:11111111-1111-1111-1111-111111111111"
        )

    def test_canaux_distincts_pour_des_ids_distincts(self) -> None:
        premier = deployment_channel(UUID("11111111-1111-1111-1111-111111111111"))
        second = deployment_channel(UUID("22222222-2222-2222-2222-222222222222"))

        assert premier != second
