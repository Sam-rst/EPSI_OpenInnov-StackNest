"""Tests unitaires des donnees de seed du catalogue (integrite, coherence)."""

from app.catalog.application.commands.template_command import ParamSpec, TemplateCommand
from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.param_type import ParamType
from app.catalog.domain.value_objects.slug import Slug
from app.catalog.infrastructure.seed.catalog_seed import CATALOG_SEED

_BY_SLUG = {item.slug: item for item in CATALOG_SEED}


def _param_by_key(slug: str, key: str) -> ParamSpec:
    return next(param for param in _BY_SLUG[slug].params if param.key == key)


_EXPECTED_SLUGS = {
    # Socle historique (12)
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
    # Bases & data
    "mysql",
    "mariadb",
    "mongodb",
    "couchdb",
    "meilisearch",
    "influxdb",
    "neo4j",
    "clickhouse",
    # Cache & messaging
    "memcached",
    "rabbitmq",
    "nats",
    "mosquitto",
    "kafka",
    # Runtimes & web / proxy
    "traefik",
    "caddy",
    "php",
    "golang",
    "adminer",
    "gitea",
    "n8n",
    # Observabilite & securite
    "grafana",
    "prometheus",
    "loki",
    "jaeger",
    "uptime-kuma",
    "mailhog",
    "keycloak",
    # Infra / cloud — Terraform (bloques)
    "kubernetes",
    "managed-database",
    "load-balancer",
    "dns-zone",
    "cdn",
    "serverless-function",
}

_EXPECTED_COUNT = 45


class TestSeedDataset:
    def test_contient_le_compte_attendu_de_templates(self) -> None:
        assert len(CATALOG_SEED) == _EXPECTED_COUNT

    def test_compte_coherent_avec_les_slugs_attendus(self) -> None:
        assert len(CATALOG_SEED) == len(_EXPECTED_SLUGS)

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
        # Le mot de passe racine est desormais injecte via secret_env.
        assert item.secret_env == "MINIO_ROOT_PASSWORD"

    def test_s3_bucket_sans_image(self) -> None:
        item = _BY_SLUG["s3"]

        assert item.image_repository is None
        assert item.internal_port is None
        assert item.secret_env is None

    def test_mysql_pointe_image_mysql_avec_secret(self) -> None:
        item = _BY_SLUG["mysql"]

        assert item.image_repository == "mysql"
        assert item.internal_port == 3306
        assert item.secret_env == "MYSQL_ROOT_PASSWORD"

    def test_mongodb_pointe_image_mongo_avec_secret(self) -> None:
        item = _BY_SLUG["mongodb"]

        assert item.image_repository == "mongo"
        assert item.internal_port == 27017
        assert item.secret_env == "MONGO_INITDB_ROOT_PASSWORD"

    def test_meilisearch_image_avec_namespace_et_cle(self) -> None:
        item = _BY_SLUG["meilisearch"]

        assert item.image_repository == "getmeili/meilisearch"
        assert item.internal_port == 7700
        assert item.secret_env == "MEILI_MASTER_KEY"

    def test_kafka_expose_port_sans_secret(self) -> None:
        item = _BY_SLUG["kafka"]

        assert item.image_repository == "apache/kafka"
        assert item.internal_port == 9092
        assert item.secret_env is None

    def test_rabbitmq_image_avec_secret(self) -> None:
        item = _BY_SLUG["rabbitmq"]

        assert item.image_repository == "rabbitmq"
        assert item.internal_port == 5672
        assert item.secret_env == "RABBITMQ_DEFAULT_PASS"

    def test_grafana_image_avec_namespace_et_secret(self) -> None:
        item = _BY_SLUG["grafana"]

        assert item.image_repository == "grafana/grafana"
        assert item.internal_port == 3000
        assert item.secret_env == "GF_SECURITY_ADMIN_PASSWORD"

    def test_keycloak_image_quay_avec_secret(self) -> None:
        item = _BY_SLUG["keycloak"]

        assert item.image_repository == "quay.io/keycloak/keycloak"
        assert item.internal_port == 8080
        assert item.secret_env == "KEYCLOAK_ADMIN_PASSWORD"

    def test_golang_sans_port_ni_secret(self) -> None:
        item = _BY_SLUG["golang"]

        assert item.image_repository == "golang"
        assert item.internal_port is None
        assert item.secret_env is None

    def test_kubernetes_terraform_sans_image(self) -> None:
        item = _BY_SLUG["kubernetes"]

        assert item.image_repository is None
        assert item.internal_port is None
        assert item.secret_env is None
        assert item.provider == "Terraform"

    def test_un_secret_implique_une_image(self) -> None:
        for item in CATALOG_SEED:
            if item.secret_env is not None:
                assert item.image_repository is not None, item.slug

    def test_un_port_interne_implique_une_image(self) -> None:
        for item in CATALOG_SEED:
            if item.internal_port is not None:
                assert item.image_repository is not None, item.slug


_EXPECTED_TERRAFORM_SLUGS = {
    "ubuntu-24-04",
    "elk",
    "vpc",
    "s3",
    "kubernetes",
    "managed-database",
    "load-balancer",
    "dns-zone",
    "cdn",
    "serverless-function",
}


class TestSeedEngine:
    """Verifie le moteur de provisioning derive de la presence d'une image."""

    def test_ressources_sans_image_sont_terraform(self) -> None:
        terraform_slugs = {
            item.slug for item in CATALOG_SEED if item.engine is EngineKind.TERRAFORM
        }

        assert terraform_slugs == _EXPECTED_TERRAFORM_SLUGS

    def test_ressources_avec_image_sont_docker(self) -> None:
        for item in CATALOG_SEED:
            if item.image_repository is not None:
                assert item.engine is EngineKind.DOCKER, item.slug

    def test_engine_terraform_implique_aucune_image(self) -> None:
        for item in CATALOG_SEED:
            if item.engine is EngineKind.TERRAFORM:
                assert item.image_repository is None, item.slug

    def test_engine_coherent_avec_la_presence_d_image(self) -> None:
        for item in CATALOG_SEED:
            expected = (
                EngineKind.DOCKER if item.image_repository is not None else EngineKind.TERRAFORM
            )
            assert item.engine is expected, item.slug


class TestSeedVariablesEnv:
    """Verifie le mapping parametre -> variable d'env du conteneur (config reelle)."""

    def test_postgres_db_name_mappe_postgres_db(self) -> None:
        assert _param_by_key("postgresql-16", "db_name").env_var == "POSTGRES_DB"

    def test_mysql_db_name_mappe_mysql_database(self) -> None:
        assert _param_by_key("mysql", "db_name").env_var == "MYSQL_DATABASE"

    def test_mariadb_db_name_mappe_mariadb_database(self) -> None:
        assert _param_by_key("mariadb", "db_name").env_var == "MARIADB_DATABASE"

    def test_mongodb_db_name_mappe_mongo_initdb_database(self) -> None:
        assert _param_by_key("mongodb", "db_name").env_var == "MONGO_INITDB_DATABASE"

    def test_mongodb_username_mappe_root_username(self) -> None:
        username = _param_by_key("mongodb", "username")
        assert username.env_var == "MONGO_INITDB_ROOT_USERNAME"
        assert username.default_value == "root"

    def test_minio_root_user_mappe_minio_root_user(self) -> None:
        assert _param_by_key("minio", "root_user").env_var == "MINIO_ROOT_USER"

    def test_couchdb_username_mappe_couchdb_user(self) -> None:
        username = _param_by_key("couchdb", "username")
        assert username.env_var == "COUCHDB_USER"
        assert username.default_value == "admin"

    def test_influxdb_db_name_mappe_init_bucket(self) -> None:
        assert _param_by_key("influxdb", "db_name").env_var == "DOCKER_INFLUXDB_INIT_BUCKET"

    def test_influxdb_username_mappe_init_username(self) -> None:
        assert _param_by_key("influxdb", "username").env_var == "DOCKER_INFLUXDB_INIT_USERNAME"

    def test_grafana_username_mappe_gf_admin_user(self) -> None:
        assert _param_by_key("grafana", "username").env_var == "GF_SECURITY_ADMIN_USER"

    def test_keycloak_username_mappe_keycloak_admin(self) -> None:
        assert _param_by_key("keycloak", "username").env_var == "KEYCLOAK_ADMIN"

    def test_rabbitmq_username_mappe_default_user(self) -> None:
        username = _param_by_key("rabbitmq", "username")
        assert username.env_var == "RABBITMQ_DEFAULT_USER"
        assert username.default_value == "user"

    def test_le_port_n_est_jamais_mappe_en_variable_d_env(self) -> None:
        for item in CATALOG_SEED:
            for param in item.params:
                if param.key == "port":
                    assert param.env_var is None, item.slug

    def test_la_memoire_n_est_jamais_mappee_en_variable_d_env(self) -> None:
        for item in CATALOG_SEED:
            for param in item.params:
                if param.key == "memory_mb":
                    assert param.env_var is None, item.slug

    def test_aucun_parametre_secret_ne_porte_une_variable_d_env(self) -> None:
        # Securite : un secret ne fuit jamais en clair via env_var (il passe par
        # secret_env du template, alimente par un secret genere worker-side).
        for item in CATALOG_SEED:
            for param in item.params:
                if param.type is ParamType.SECRET:
                    assert param.env_var is None, f"{item.slug}.{param.key}"
