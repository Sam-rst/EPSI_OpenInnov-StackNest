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

    def test_connection_username_postgres(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="postgres",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
            engine=EngineKind.DOCKER,
        )

        assert descriptor.connection_username() == "postgres"

    def test_connection_username_mysql_et_mariadb_sont_root(self) -> None:
        for image in ("mysql", "mariadb"):
            descriptor = TemplateProvisioning(
                image_repository=image,
                internal_port=3306,
                secret_env="MYSQL_ROOT_PASSWORD",
                engine=EngineKind.DOCKER,
            )

            assert descriptor.connection_username() == "root"

    def test_connection_username_none_pour_image_sans_compte_par_defaut(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="nginx",
            internal_port=80,
            secret_env=None,
            engine=EngineKind.DOCKER,
        )

        assert descriptor.connection_username() is None

    def test_connection_username_none_quand_aucune_image(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository=None,
            internal_port=None,
            secret_env=None,
            engine=EngineKind.TERRAFORM,
        )

        assert descriptor.connection_username() is None


class TestTemplateProvisioningCommand:
    def test_command_absente_par_defaut(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="nginx",
            internal_port=80,
            secret_env=None,
            engine=EngineKind.DOCKER,
        )

        assert descriptor.command is None

    def test_command_renseignee(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="quay.io/keycloak/keycloak",
            internal_port=8080,
            secret_env="KEYCLOAK_ADMIN_PASSWORD",
            engine=EngineKind.DOCKER,
            command=("start-dev",),
        )

        assert descriptor.command == ("start-dev",)


class TestTemplateProvisioningDeployable:
    def test_is_deployable_vrai_par_defaut(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="node",
            internal_port=None,
            secret_env=None,
            engine=EngineKind.DOCKER,
        )

        assert descriptor.is_deployable is True

    def test_is_deployable_faux_explicite(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="node",
            internal_port=None,
            secret_env=None,
            engine=EngineKind.DOCKER,
            is_deployable=False,
        )

        assert descriptor.is_deployable is False


class TestTemplateProvisioningResolveSecretValue:
    """Gabarit de la valeur injectee dans secret_env (securite : uniquement {secret})."""

    def test_sans_gabarit_renvoie_le_secret_brut(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="postgres",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
            engine=EngineKind.DOCKER,
        )

        assert descriptor.resolve_secret_value("s3cr3t") == "s3cr3t"

    def test_gabarit_formate_le_secret(self) -> None:
        descriptor = TemplateProvisioning(
            image_repository="neo4j",
            internal_port=7474,
            secret_env="NEO4J_AUTH",
            engine=EngineKind.DOCKER,
            secret_value_template="neo4j/{secret}",
        )

        assert descriptor.resolve_secret_value("s3cr3t") == "neo4j/s3cr3t"

    def test_gabarit_avec_placeholder_inconnu_leve(self) -> None:
        # Securite : le gabarit n'accepte QUE le placeholder {secret}, jamais une
        # autre cle qui pourrait fuiter des donnees ou casser le formatage.
        descriptor = TemplateProvisioning(
            image_repository="neo4j",
            internal_port=7474,
            secret_env="NEO4J_AUTH",
            engine=EngineKind.DOCKER,
            secret_value_template="{user}/{secret}",
        )

        with pytest.raises(ValueError):
            descriptor.resolve_secret_value("s3cr3t")
