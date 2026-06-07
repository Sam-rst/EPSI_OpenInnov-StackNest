"""Tests unitaires des donnees de seed du catalogue (integrite, coherence)."""

from app.catalog.application.commands.template_command import TemplateCommand
from app.catalog.domain.value_objects.slug import Slug
from app.catalog.infrastructure.seed.catalog_seed import CATALOG_SEED

_BY_SLUG = {item.slug: item for item in CATALOG_SEED}

_EXPECTED_SLUGS = {
    "postgresql-16",
    "redis-7",
    "minio",
    "ubuntu-24-04",
    "node-20",
    "python-3-13",
    "nginx",
    "vault",
    "elk",
    "ollama",
    "vpc",
    "s3",
}


class TestSeedDataset:
    def test_contient_douze_templates(self) -> None:
        assert len(CATALOG_SEED) == 12

    def test_slugs_attendus(self) -> None:
        assert {item.slug for item in CATALOG_SEED} == _EXPECTED_SLUGS

    def test_slugs_uniques(self) -> None:
        slugs = [item.slug for item in CATALOG_SEED]

        assert len(slugs) == len(set(slugs))

    def test_chaque_slug_est_valide(self) -> None:
        for item in CATALOG_SEED:
            assert str(Slug(item.slug)) == item.slug


class TestSeedCoherence:
    def test_chaque_template_a_au_moins_une_version(self) -> None:
        for item in CATALOG_SEED:
            assert len(item.versions) >= 1

    def test_chaque_template_a_exactement_une_version_par_defaut(self) -> None:
        for item in CATALOG_SEED:
            defaults = [version for version in item.versions if version.is_default]
            assert len(defaults) == 1, item.slug

    def test_chaque_template_a_au_moins_un_parametre(self) -> None:
        for item in CATALOG_SEED:
            assert len(item.params) >= 1, item.slug

    def test_ordres_des_parametres_sont_uniques(self) -> None:
        for item in CATALOG_SEED:
            orders = [param.order_index for param in item.params]
            assert len(orders) == len(set(orders)), item.slug

    def test_les_items_sont_des_commandes(self) -> None:
        for item in CATALOG_SEED:
            assert isinstance(item, TemplateCommand)


class TestSeedDescripteurProvisioning:
    """Verifie le descripteur de provisioning (image/port/secret) par template."""

    def test_postgresql_pointe_image_postgres(self) -> None:
        item = _BY_SLUG["postgresql-16"]

        assert item.image_repository == "postgres"
        assert item.internal_port == 5432
        assert item.secret_env == "POSTGRES_PASSWORD"

    def test_redis_sans_secret(self) -> None:
        item = _BY_SLUG["redis-7"]

        assert item.image_repository == "redis"
        assert item.internal_port == 6379
        assert item.secret_env is None

    def test_nginx_expose_port_80_sans_secret(self) -> None:
        item = _BY_SLUG["nginx"]

        assert item.image_repository == "nginx"
        assert item.internal_port == 80
        assert item.secret_env is None

    def test_node_sans_port_ni_secret(self) -> None:
        item = _BY_SLUG["node-20"]

        assert item.image_repository == "node"
        assert item.internal_port is None
        assert item.secret_env is None

    def test_python_sans_port_ni_secret(self) -> None:
        item = _BY_SLUG["python-3-13"]

        assert item.image_repository == "python"
        assert item.internal_port is None
        assert item.secret_env is None

    def test_ollama_image_avec_namespace(self) -> None:
        item = _BY_SLUG["ollama"]

        assert item.image_repository == "ollama/ollama"
        assert item.internal_port == 11434
        assert item.secret_env is None

    def test_minio_image_avec_namespace(self) -> None:
        item = _BY_SLUG["minio"]

        assert item.image_repository == "minio/minio"
        assert item.internal_port == 9000
        assert item.secret_env is None

    def test_s3_bucket_sans_image(self) -> None:
        item = _BY_SLUG["s3"]

        assert item.image_repository is None
        assert item.internal_port is None
        assert item.secret_env is None

    def test_un_secret_implique_une_image(self) -> None:
        for item in CATALOG_SEED:
            if item.secret_env is not None:
                assert item.image_repository is not None, item.slug

    def test_un_port_interne_implique_une_image(self) -> None:
        for item in CATALOG_SEED:
            if item.internal_port is not None:
                assert item.image_repository is not None, item.slug
