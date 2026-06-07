"""Tests unitaires du ContainerSpecFactory (regle image + injection du secret)."""

import pytest

from app.deployment.domain.factories.container_spec_factory import ContainerSpecFactory


class TestImageEffective:
    def test_image_est_repo_deux_points_version(self) -> None:
        spec = ContainerSpecFactory.build(
            image_repository="postgres",
            version="16",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
            params={},
            secret="s3cr3t",
        )

        assert spec.image == "postgres:16"

    def test_image_repository_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            ContainerSpecFactory.build(
                image_repository="   ",
                version="16",
                internal_port=5432,
                secret_env="POSTGRES_PASSWORD",
                params={},
                secret="s3cr3t",
            )

    def test_version_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            ContainerSpecFactory.build(
                image_repository="postgres",
                version="",
                internal_port=5432,
                secret_env="POSTGRES_PASSWORD",
                params={},
                secret="s3cr3t",
            )


class TestInjectionSecret:
    def test_secret_injecte_quand_secret_env_defini(self) -> None:
        spec = ContainerSpecFactory.build(
            image_repository="postgres",
            version="16",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
            params={},
            secret="s3cr3t",
        )

        assert spec.env == {"POSTGRES_PASSWORD": "s3cr3t"}

    def test_pas_de_secret_quand_secret_env_null(self) -> None:
        spec = ContainerSpecFactory.build(
            image_repository="nginx",
            version="1.27",
            internal_port=80,
            secret_env=None,
            params={},
            secret="s3cr3t",
        )

        assert spec.env == {}

    def test_secret_requis_quand_secret_env_defini(self) -> None:
        with pytest.raises(ValueError):
            ContainerSpecFactory.build(
                image_repository="postgres",
                version="16",
                internal_port=5432,
                secret_env="POSTGRES_PASSWORD",
                params={},
                secret=None,
            )

    def test_secret_ignore_quand_secret_env_null(self) -> None:
        # Un secret fourni sans cible (secret_env None) ne casse rien.
        spec = ContainerSpecFactory.build(
            image_repository="nginx",
            version="1.27",
            internal_port=80,
            secret_env=None,
            params={},
            secret=None,
        )

        assert spec.env == {}


class TestPortEtParams:
    def test_internal_port_reporte(self) -> None:
        spec = ContainerSpecFactory.build(
            image_repository="redis",
            version="7",
            internal_port=6379,
            secret_env=None,
            params={},
            secret=None,
        )

        assert spec.internal_port == 6379

    def test_internal_port_null_supporte(self) -> None:
        spec = ContainerSpecFactory.build(
            image_repository="nginx",
            version="1.27",
            internal_port=None,
            secret_env=None,
            params={},
            secret=None,
        )

        assert spec.internal_port is None

    def test_label_deployment_id_pose_quand_fourni(self) -> None:
        spec = ContainerSpecFactory.build(
            image_repository="postgres",
            version="16",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
            params={},
            secret="s3cr3t",
            deployment_id="abc-123",
        )

        assert spec.labels == {"stacknest.deployment_id": "abc-123"}
