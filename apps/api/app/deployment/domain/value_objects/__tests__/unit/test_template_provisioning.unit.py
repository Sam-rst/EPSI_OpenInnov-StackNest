"""Tests unitaires du value object TemplateProvisioning."""

import pytest

from app.catalog.domain.enums.engine_kind import EngineKind
from app.deployment.domain.value_objects.template_provisioning import TemplateProvisioning


class TestTemplateProvisioning:
    def test_construit_un_descripteur_docker_valide(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="postgres",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
            engine=EngineKind.DOCKER,
        )

        assert descriptor.image_repository == "postgres"
        assert descriptor.internal_port == 5432
        assert descriptor.secret_env == "POSTGRES_PASSWORD"
        assert descriptor.engine is EngineKind.DOCKER

    def test_accepte_un_descripteur_sans_port_ni_secret(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="nginx",
            internal_port=None,
            secret_env=None,
            engine=EngineKind.DOCKER,
        )

        assert descriptor.internal_port is None
        assert descriptor.secret_env is None

    def test_est_immuable(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="redis",
            internal_port=6379,
            secret_env=None,
            engine=EngineKind.DOCKER,
        )

        with pytest.raises(AttributeError):
            descriptor.image_repository = "postgres"  # type: ignore[misc]

    def test_is_docker_vrai_pour_moteur_docker(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="postgres",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
            engine=EngineKind.DOCKER,
        )

        assert descriptor.is_docker() is True

    def test_is_docker_faux_pour_moteur_terraform(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository=None,
            internal_port=None,
            secret_env=None,
            engine=EngineKind.TERRAFORM,
        )

        assert descriptor.is_docker() is False

    def test_requires_secret_vrai_si_secret_env_declare(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="postgres",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
            engine=EngineKind.DOCKER,
        )

        assert descriptor.requires_secret() is True

    def test_requires_secret_faux_si_secret_env_absent(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="nginx",
            internal_port=80,
            secret_env=None,
            engine=EngineKind.DOCKER,
        )

        assert descriptor.requires_secret() is False
