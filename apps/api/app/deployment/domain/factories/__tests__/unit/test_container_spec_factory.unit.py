"""Tests unitaires du ContainerSpecFactory (regle image + injection du secret)."""

import pytest

from app.catalog.domain.enums.param_type import ParamType
from app.deployment.domain.factories.container_spec_factory import ContainerSpecFactory
from app.deployment.domain.value_objects.template_param_spec import TemplateParamSpec


def _spec(
    key: str,
    *,
    type: ParamType = ParamType.STRING,
    env_var: str | None = None,
) -> TemplateParamSpec:
    return TemplateParamSpec(key=key, type=type, required=False, options=None, env_var=env_var)


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


class TestInjectionParamsEnv:
    def test_param_non_secret_avec_env_var_est_injecte(self) -> None:
        spec = ContainerSpecFactory.build(
            image_repository="postgres",
            version="16",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
            params={"db_name": "mabase"},
            param_specs=(_spec("db_name", env_var="POSTGRES_DB"),),
            secret="s3cr3t",
        )

        assert spec.env["POSTGRES_DB"] == "mabase"
        assert spec.env["POSTGRES_PASSWORD"] == "s3cr3t"

    def test_valeur_non_chaine_est_serialisee_en_texte(self) -> None:
        spec = ContainerSpecFactory.build(
            image_repository="mongo",
            version="8.0",
            internal_port=27017,
            secret_env=None,
            params={"replicas": 3},
            param_specs=(_spec("replicas", type=ParamType.INT, env_var="MONGO_REPLICAS"),),
            secret=None,
        )

        assert spec.env["MONGO_REPLICAS"] == "3"

    def test_param_sans_env_var_est_ignore(self) -> None:
        spec = ContainerSpecFactory.build(
            image_repository="postgres",
            version="16",
            internal_port=5432,
            secret_env=None,
            params={"port": "5432"},
            param_specs=(_spec("port", type=ParamType.INT, env_var=None),),
            secret=None,
        )

        assert spec.env == {}

    def test_param_absent_des_valeurs_est_ignore(self) -> None:
        # Le param declare un env_var mais aucune valeur n'a ete saisie.
        spec = ContainerSpecFactory.build(
            image_repository="mysql",
            version="8.4",
            internal_port=3306,
            secret_env=None,
            params={},
            param_specs=(_spec("db_name", env_var="MYSQL_DATABASE"),),
            secret=None,
        )

        assert "MYSQL_DATABASE" not in spec.env

    def test_param_secret_jamais_injecte_via_env_var(self) -> None:
        # Securite : un param de type secret ne fuite jamais en clair, meme s'il
        # porte un env_var et une valeur dans les params. Seul secret_env gere le
        # secret (genere worker-side).
        spec = ContainerSpecFactory.build(
            image_repository="postgres",
            version="16",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
            params={"password": "leaked-in-clear"},
            param_specs=(_spec("password", type=ParamType.SECRET, env_var="POSTGRES_PASSWORD"),),
            secret="generated",
        )

        assert spec.env == {"POSTGRES_PASSWORD": "generated"}
        assert "leaked-in-clear" not in spec.env.values()


class TestLimiteMemoire:
    def test_memory_mb_definit_mem_limit(self) -> None:
        spec = ContainerSpecFactory.build(
            image_repository="redis",
            version="7",
            internal_port=6379,
            secret_env=None,
            params={"memory_mb": "256"},
            param_specs=(_spec("memory_mb", type=ParamType.INT, env_var=None),),
            secret=None,
        )

        assert spec.mem_limit == "256m"

    def test_memory_mb_absent_garde_le_defaut(self) -> None:
        spec = ContainerSpecFactory.build(
            image_repository="redis",
            version="7",
            internal_port=6379,
            secret_env=None,
            params={},
            secret=None,
        )

        assert spec.mem_limit == "512m"

    def test_memory_mb_non_injecte_dans_env(self) -> None:
        # memory_mb pilote la limite memoire, pas une variable d'env.
        spec = ContainerSpecFactory.build(
            image_repository="redis",
            version="7",
            internal_port=6379,
            secret_env=None,
            params={"memory_mb": "256"},
            param_specs=(_spec("memory_mb", type=ParamType.INT, env_var=None),),
            secret=None,
        )

        assert spec.env == {}
