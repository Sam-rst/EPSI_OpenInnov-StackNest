"""Donnees de seed du catalogue : 45 templates reels (metadonnees publiques).

Catalogue legitime de ressources provisionnables, avec versions LTS/EOL
plausibles et parametres de configuration typiques. AUCUNE donnee utilisateur :
uniquement des metadonnees techniques publiques (versions, dates d'EOL connues).

Les dates d'EOL refletent les calendriers publics des projets a la date de
redaction (2026) ; elles servent d'illustration de catalogue, pas de source de
verite operationnelle.

Chaque template porte un descripteur de provisioning optionnel (image_repository
/ internal_port / secret_env) renseigne pour les ressources Docker (images
publiques reelles). Les ressources Terraform (VM, VPC, bucket S3) et les stacks
multi-conteneurs (ELK) le laissent a None.

Le moteur `engine` est coherent avec ce descripteur : `terraform` pour les
ressources sans image (VM Ubuntu, ELK, VPC, S3), `docker` (defaut) sinon.
"""

from datetime import date

from app.catalog.application.commands.template_command import (
    ParamSpec,
    TemplateCommand,
    VersionSpec,
)
from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.param_type import ParamType
from app.catalog.domain.enums.template_category import TemplateCategory


def _port_param(default: int, order: int = 1) -> ParamSpec:
    # Le port est alloue cote infra (publication Docker), pas via une variable
    # d'env du conteneur : env_var reste None.
    return ParamSpec(
        key="port",
        label="Port d'ecoute",
        type=ParamType.INT,
        required=False,
        default_value=str(default),
        options=None,
        order_index=order,
    )


def _memory_param(default_mb: int, order: int) -> ParamSpec:
    # La memoire pilote `mem_limit` du conteneur (cf. ContainerSpecFactory), pas une
    # variable d'env : env_var reste None.
    return ParamSpec(
        key="memory_mb",
        label="Memoire allouee (Mo)",
        type=ParamType.INT,
        required=False,
        default_value=str(default_mb),
        options=None,
        order_index=order,
    )


def _password_param(label: str, order: int, *, required: bool) -> ParamSpec:
    # Le mot de passe (secret) est injecte via `secret_env` du template, jamais en
    # clair via env_var : ce param reste sans env_var (None).
    return ParamSpec(
        key="password",
        label=label,
        type=ParamType.SECRET,
        required=required,
        default_value=None,
        options=None,
        order_index=order,
    )


def _username_param(default: str, order: int, *, env_var: str) -> ParamSpec:
    return ParamSpec(
        key="username",
        label="Nom d'utilisateur",
        type=ParamType.STRING,
        required=True,
        default_value=default,
        options=None,
        order_index=order,
        env_var=env_var,
    )


def _db_name_param(default: str, order: int, *, env_var: str | None = None) -> ParamSpec:
    return ParamSpec(
        key="db_name",
        label="Nom de la base",
        type=ParamType.STRING,
        required=True,
        default_value=default,
        options=None,
        order_index=order,
        env_var=env_var,
    )


def _start_command_param(default: str, order: int) -> ParamSpec:
    return ParamSpec(
        key="start_command",
        label="Commande de demarrage",
        type=ParamType.STRING,
        required=False,
        default_value=default,
        options=None,
        order_index=order,
    )


_POSTGRESQL = TemplateCommand(
    slug="postgresql-16",
    name="PostgreSQL",
    icon="database",
    category=TemplateCategory.DATABASE,
    provider="Docker",
    description="Base relationnelle managee, backups & replicas.",
    popular=True,
    tags=["SQL", "Persistant"],
    is_active=True,
    image_repository="postgres",
    internal_port=5432,
    secret_env="POSTGRES_PASSWORD",
    versions=[
        VersionSpec(version="16", is_default=True, is_lts=False, eol_date=date(2028, 11, 9)),
        VersionSpec(version="15", is_default=False, is_lts=True, eol_date=date(2027, 11, 11)),
        VersionSpec(version="14", is_default=False, is_lts=False, eol_date=date(2026, 11, 12)),
    ],
    params=[
        ParamSpec(
            key="db_name",
            label="Nom de la base",
            type=ParamType.STRING,
            required=True,
            default_value="app",
            options=None,
            order_index=0,
            env_var="POSTGRES_DB",
        ),
        _port_param(5432),
        ParamSpec(
            key="password",
            label="Mot de passe superutilisateur",
            type=ParamType.SECRET,
            required=True,
            default_value=None,
            options=None,
            order_index=2,
        ),
        _memory_param(512, 3),
    ],
)

_REDIS = TemplateCommand(
    slug="redis-7",
    name="Redis",
    icon="server",
    category=TemplateCategory.CACHE,
    provider="Docker",
    description="Store cle-valeur ultra-rapide pour cache & queues.",
    popular=True,
    tags=["Cache", "In-memory"],
    is_active=True,
    image_repository="redis",
    internal_port=6379,
    secret_env=None,
    versions=[
        VersionSpec(version="7.2", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="7.0", is_default=False, is_lts=False, eol_date=date(2025, 12, 31)),
    ],
    params=[
        _port_param(6379, 0),
        ParamSpec(
            key="password",
            label="Mot de passe (requirepass)",
            type=ParamType.SECRET,
            required=False,
            default_value=None,
            options=None,
            order_index=1,
        ),
        _memory_param(256, 2),
    ],
)

_MINIO = TemplateCommand(
    slug="minio",
    name="MinIO",
    icon="hard-drive",
    category=TemplateCategory.STORAGE,
    provider="Docker",
    description="Stockage objet compatible S3 self-hosted.",
    popular=False,
    tags=["S3", "Object"],
    is_active=True,
    image_repository="minio/minio",
    internal_port=9000,
    secret_env="MINIO_ROOT_PASSWORD",
    # Sans sous-commande l'image MinIO affiche l'aide et sort : on demarre le serveur
    # objet sur /data et on fixe le port console (sinon port dynamique + avertissement).
    command=["server", "/data", "--console-address", ":9001"],
    versions=[
        VersionSpec(
            version="RELEASE.2025-04-22T22-12-26Z", is_default=True, is_lts=False, eol_date=None
        ),
    ],
    params=[
        ParamSpec(
            key="root_user",
            label="Utilisateur racine",
            type=ParamType.STRING,
            required=True,
            default_value="minioadmin",
            options=None,
            order_index=0,
            env_var="MINIO_ROOT_USER",
        ),
        ParamSpec(
            key="root_password",
            label="Mot de passe racine",
            type=ParamType.SECRET,
            required=True,
            default_value=None,
            options=None,
            order_index=1,
        ),
        _port_param(9000, 2),
    ],
)

_UBUNTU = TemplateCommand(
    slug="ubuntu-24-04",
    name="VM Ubuntu",
    icon="monitor",
    category=TemplateCategory.VM,
    provider="Terraform",
    description="Machine virtuelle Ubuntu LTS, SSH ready.",
    popular=True,
    tags=["VM", "Linux"],
    is_active=True,
    engine=EngineKind.TERRAFORM,
    # Provisionnee par Terraform (VM), pas via une image Docker.
    image_repository=None,
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="24.04 LTS", is_default=True, is_lts=True, eol_date=date(2029, 4, 30)),
        VersionSpec(version="22.04 LTS", is_default=False, is_lts=True, eol_date=date(2027, 4, 30)),
    ],
    params=[
        ParamSpec(
            key="hostname",
            label="Nom d'hote",
            type=ParamType.STRING,
            required=True,
            default_value="vm-ubuntu",
            options=None,
            order_index=0,
        ),
        ParamSpec(
            key="vcpus",
            label="Nombre de vCPU",
            type=ParamType.INT,
            required=False,
            default_value="2",
            options=None,
            order_index=1,
        ),
        _memory_param(2048, 2),
        ParamSpec(
            key="ssh_public_key",
            label="Cle publique SSH",
            type=ParamType.SECRET,
            required=True,
            default_value=None,
            options=None,
            order_index=3,
        ),
    ],
)

_NODE = TemplateCommand(
    slug="node-20",
    name="Conteneur Node.js",
    icon="box",
    category=TemplateCategory.RUNTIME,
    provider="Docker",
    description="Image Node LTS prete a deployer.",
    popular=False,
    tags=["Runtime", "JS"],
    is_active=True,
    # Runtime langage : aucun service long-running utile au MVP -> visible mais bloque.
    is_deployable=False,
    image_repository="node",
    internal_port=None,
    secret_env=None,
    versions=[
        # Le tag d'image Docker est `20` / `22` (pas « 20 LTS » : espace invalide).
        VersionSpec(version="20", is_default=True, is_lts=True, eol_date=date(2026, 4, 30)),
        VersionSpec(version="22", is_default=False, is_lts=True, eol_date=date(2027, 4, 30)),
    ],
    params=[
        _port_param(3000, 0),
        ParamSpec(
            key="start_command",
            label="Commande de demarrage",
            type=ParamType.STRING,
            required=False,
            default_value="npm start",
            options=None,
            order_index=1,
        ),
        _memory_param(512, 2),
    ],
)

_PYTHON = TemplateCommand(
    slug="python-3-13",
    name="Conteneur Python",
    icon="box",
    category=TemplateCategory.RUNTIME,
    provider="Docker",
    description="Python + venv preconfigure.",
    popular=False,
    tags=["Runtime", "Python"],
    is_active=True,
    # Runtime langage : aucun service long-running utile au MVP -> visible mais bloque.
    is_deployable=False,
    image_repository="python",
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="3.13", is_default=True, is_lts=False, eol_date=date(2029, 10, 31)),
        VersionSpec(version="3.12", is_default=False, is_lts=False, eol_date=date(2028, 10, 31)),
    ],
    params=[
        _port_param(8000, 0),
        ParamSpec(
            key="start_command",
            label="Commande de demarrage",
            type=ParamType.STRING,
            required=False,
            default_value="python -m app",
            options=None,
            order_index=1,
        ),
        _memory_param(512, 2),
    ],
)

_NGINX = TemplateCommand(
    slug="nginx",
    name="Conteneur Nginx",
    icon="globe",
    category=TemplateCategory.NETWORK,
    provider="Docker",
    description="Reverse proxy + TLS auto via Let's Encrypt.",
    popular=False,
    tags=["Proxy", "TLS"],
    is_active=True,
    image_repository="nginx",
    internal_port=80,
    secret_env=None,
    versions=[
        VersionSpec(version="1.27", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="1.26", is_default=False, is_lts=True, eol_date=None),
    ],
    params=[
        _port_param(80, 0),
        ParamSpec(
            key="enable_tls",
            label="Activer TLS (HTTPS)",
            type=ParamType.BOOL,
            required=False,
            default_value="true",
            options=None,
            order_index=1,
        ),
        ParamSpec(
            key="server_name",
            label="Nom de domaine",
            type=ParamType.STRING,
            required=False,
            default_value="localhost",
            options=None,
            order_index=2,
        ),
    ],
)

_VAULT = TemplateCommand(
    slug="vault",
    name="Vault",
    icon="lock",
    category=TemplateCategory.SECURITY,
    provider="Docker",
    description="Coffre de secrets et rotation de credentials.",
    popular=False,
    tags=["Secrets", "KMS"],
    is_active=True,
    image_repository="hashicorp/vault",
    internal_port=8200,
    secret_env=None,
    versions=[
        VersionSpec(version="1.17", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="1.16", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(8200, 0),
        ParamSpec(
            key="storage_backend",
            label="Backend de stockage",
            type=ParamType.SELECT,
            required=True,
            default_value="file",
            options={"choices": ["file", "raft", "consul"]},
            order_index=1,
        ),
    ],
)

_ELK = TemplateCommand(
    slug="elk",
    name="Stack ELK",
    icon="bar-chart-3",
    category=TemplateCategory.OBSERVABILITY,
    provider="Docker",
    description="Elasticsearch + Logstash + Kibana, pret a indexer.",
    popular=False,
    tags=["Logs", "Search"],
    is_active=True,
    engine=EngineKind.TERRAFORM,
    # Stack multi-conteneurs : pas une image unique provisionnable telle quelle.
    image_repository=None,
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="8.15", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="7.17", is_default=False, is_lts=True, eol_date=date(2026, 8, 1)),
    ],
    params=[
        _port_param(9200, 0),
        _memory_param(4096, 1),
        ParamSpec(
            key="enable_kibana",
            label="Deployer Kibana",
            type=ParamType.BOOL,
            required=False,
            default_value="true",
            options=None,
            order_index=2,
        ),
    ],
)

_OLLAMA = TemplateCommand(
    slug="ollama",
    name="Ollama",
    icon="sparkles",
    category=TemplateCategory.AI,
    provider="Docker",
    description="Serveur de modeles LLM local (llama, mistral...).",
    popular=True,
    tags=["LLM", "GPU"],
    is_active=True,
    image_repository="ollama/ollama",
    internal_port=11434,
    secret_env=None,
    versions=[
        VersionSpec(version="0.5.13", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(11434, 0),
        ParamSpec(
            key="default_model",
            label="Modele par defaut",
            type=ParamType.SELECT,
            required=True,
            default_value="llama3.1",
            options={"choices": ["llama3.1", "mistral", "phi3", "qwen2.5"]},
            order_index=1,
        ),
        ParamSpec(
            key="enable_gpu",
            label="Activer le GPU",
            type=ParamType.BOOL,
            required=False,
            default_value="false",
            options=None,
            order_index=2,
        ),
    ],
)

_VPC = TemplateCommand(
    slug="vpc",
    name="Reseau VPC",
    icon="network",
    category=TemplateCategory.NETWORK,
    provider="Terraform",
    description="Reseau isole avec sous-reseaux & routing.",
    popular=False,
    tags=["VPC", "Subnet"],
    is_active=True,
    engine=EngineKind.TERRAFORM,
    # Ressource reseau provisionnee par Terraform, pas un conteneur Docker.
    image_repository=None,
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="v1", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        ParamSpec(
            key="cidr_block",
            label="Bloc CIDR",
            type=ParamType.STRING,
            required=True,
            default_value="10.0.0.0/16",
            options=None,
            order_index=0,
        ),
        ParamSpec(
            key="subnet_count",
            label="Nombre de sous-reseaux",
            type=ParamType.INT,
            required=False,
            default_value="2",
            options=None,
            order_index=1,
        ),
    ],
)

_S3 = TemplateCommand(
    slug="s3",
    name="Bucket S3",
    icon="archive",
    category=TemplateCategory.STORAGE,
    provider="Terraform",
    description="Bucket S3 versionne, IAM scope.",
    popular=False,
    tags=["S3", "AWS"],
    is_active=True,
    engine=EngineKind.TERRAFORM,
    # Bucket d'objet (Terraform), pas une image Docker.
    image_repository=None,
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="v1", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        ParamSpec(
            key="bucket_name",
            label="Nom du bucket",
            type=ParamType.STRING,
            required=True,
            default_value="mon-bucket",
            options=None,
            order_index=0,
        ),
        ParamSpec(
            key="versioning",
            label="Activer le versioning",
            type=ParamType.BOOL,
            required=False,
            default_value="true",
            options=None,
            order_index=1,
        ),
        ParamSpec(
            key="acl",
            label="Politique d'acces (ACL)",
            type=ParamType.SELECT,
            required=False,
            default_value="private",
            options={"choices": ["private", "public-read", "authenticated-read"]},
            order_index=2,
        ),
    ],
)


# --------------------------------------------------------------------------- #
# Bases de donnees & moteurs de data (Docker)                                  #
# --------------------------------------------------------------------------- #

_MYSQL = TemplateCommand(
    slug="mysql",
    name="MySQL",
    icon="database",
    category=TemplateCategory.DATABASE,
    provider="Docker",
    description="Base relationnelle SQL la plus repandue.",
    popular=True,
    tags=["SQL", "Persistant"],
    is_active=True,
    image_repository="mysql",
    internal_port=3306,
    secret_env="MYSQL_ROOT_PASSWORD",
    versions=[
        VersionSpec(version="8.4", is_default=True, is_lts=True, eol_date=date(2032, 4, 30)),
        VersionSpec(version="8.0", is_default=False, is_lts=False, eol_date=date(2026, 4, 30)),
    ],
    params=[
        _db_name_param("app", 0, env_var="MYSQL_DATABASE"),
        _port_param(3306),
        _password_param("Mot de passe root", 2, required=True),
        _memory_param(512, 3),
    ],
)

_MARIADB = TemplateCommand(
    slug="mariadb",
    name="MariaDB",
    icon="database",
    category=TemplateCategory.DATABASE,
    provider="Docker",
    description="Fork communautaire de MySQL, compatible et performant.",
    popular=False,
    tags=["SQL", "Persistant"],
    is_active=True,
    image_repository="mariadb",
    internal_port=3306,
    secret_env="MARIADB_ROOT_PASSWORD",
    versions=[
        VersionSpec(version="11.4", is_default=True, is_lts=True, eol_date=date(2029, 5, 29)),
        VersionSpec(version="10.11", is_default=False, is_lts=True, eol_date=date(2028, 2, 16)),
    ],
    params=[
        _db_name_param("app", 0, env_var="MARIADB_DATABASE"),
        _port_param(3306),
        _password_param("Mot de passe root", 2, required=True),
        _memory_param(512, 3),
    ],
)

_MONGODB = TemplateCommand(
    slug="mongodb",
    name="MongoDB",
    icon="database",
    category=TemplateCategory.DATABASE,
    provider="Docker",
    description="Base documentaire NoSQL orientee JSON/BSON.",
    popular=True,
    tags=["NoSQL", "Document"],
    is_active=True,
    image_repository="mongo",
    internal_port=27017,
    secret_env="MONGO_INITDB_ROOT_PASSWORD",
    versions=[
        VersionSpec(version="8.0", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="7.0", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _db_name_param("app", 0, env_var="MONGO_INITDB_DATABASE"),
        _port_param(27017),
        _password_param("Mot de passe root", 2, required=True),
        _memory_param(512, 3),
        # Active l'auth root (sinon MONGO_INITDB_ROOT_PASSWORD seul est ignore).
        _username_param("root", 4, env_var="MONGO_INITDB_ROOT_USERNAME"),
    ],
)

_COUCHDB = TemplateCommand(
    slug="couchdb",
    name="CouchDB",
    icon="database",
    category=TemplateCategory.DATABASE,
    provider="Docker",
    description="Base documentaire repliquable, API HTTP/JSON.",
    popular=False,
    tags=["NoSQL", "Document"],
    is_active=True,
    image_repository="couchdb",
    internal_port=5984,
    secret_env="COUCHDB_PASSWORD",
    versions=[
        VersionSpec(version="3.4", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="3.3", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        # CouchDB n'a pas de notion de "base par defaut" a la creation : db_name ne
        # mappe aucune variable d'env (env_var=None), il reste informatif cote UI.
        _db_name_param("app", 0),
        _port_param(5984),
        _password_param("Mot de passe administrateur", 2, required=True),
        _memory_param(512, 3),
        _username_param("admin", 4, env_var="COUCHDB_USER"),
    ],
)

_MEILISEARCH = TemplateCommand(
    slug="meilisearch",
    name="Meilisearch",
    icon="search",
    category=TemplateCategory.DATABASE,
    provider="Docker",
    description="Moteur de recherche full-text rapide et simple.",
    popular=False,
    tags=["Search", "Full-text"],
    is_active=True,
    image_repository="getmeili/meilisearch",
    internal_port=7700,
    secret_env="MEILI_MASTER_KEY",
    versions=[
        VersionSpec(version="v1.13", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="v1.12", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        # Meilisearch n'a pas de "base" a nommer : db_name reste sans env_var (None),
        # la cle maitre est injectee via secret_env (MEILI_MASTER_KEY).
        _db_name_param("documents", 0),
        _port_param(7700),
        _password_param("Cle maitre (master key)", 2, required=True),
        _memory_param(512, 3),
    ],
)

_INFLUXDB = TemplateCommand(
    slug="influxdb",
    name="InfluxDB",
    icon="database",
    category=TemplateCategory.DATABASE,
    provider="Docker",
    description="Base time-series pour metriques et capteurs.",
    popular=False,
    tags=["Time-series", "Metrics"],
    is_active=True,
    image_repository="influxdb",
    internal_port=8086,
    secret_env="DOCKER_INFLUXDB_INIT_PASSWORD",
    versions=[
        VersionSpec(version="2.7", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="1.11", is_default=False, is_lts=False, eol_date=None),
    ],
    # NOTE : InfluxDB 2.x exige un init complet (mode setup + org + bucket + user).
    # On mappe ce que l'on connait avec certitude ; le mode setup et l'organisation
    # (DOCKER_INFLUXDB_INIT_MODE / _ORG) peuvent etre necessaires -> a valider en E2E.
    params=[
        _db_name_param("metrics", 0, env_var="DOCKER_INFLUXDB_INIT_BUCKET"),
        _port_param(8086),
        _password_param("Mot de passe administrateur", 2, required=True),
        _memory_param(512, 3),
        _username_param("admin", 4, env_var="DOCKER_INFLUXDB_INIT_USERNAME"),
    ],
)

_NEO4J = TemplateCommand(
    slug="neo4j",
    name="Neo4j",
    icon="share-2",
    category=TemplateCategory.DATABASE,
    provider="Docker",
    description="Base de donnees orientee graphe (Cypher).",
    popular=False,
    tags=["Graph", "Cypher"],
    is_active=True,
    image_repository="neo4j",
    internal_port=7474,
    secret_env="NEO4J_AUTH",
    # NEO4J_AUTH attend la forme `user/password` : la valeur injectee devient
    # `neo4j/<secret>` (le secret genere reste le seul materiau secret).
    secret_value_template="neo4j/{secret}",
    versions=[
        VersionSpec(version="5", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="4.4", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _db_name_param("neo4j", 0),
        _port_param(7474),
        _password_param("Mot de passe (NEO4J_AUTH)", 2, required=True),
        _memory_param(1024, 3),
    ],
)

_CLICKHOUSE = TemplateCommand(
    slug="clickhouse",
    name="ClickHouse",
    icon="database",
    category=TemplateCategory.DATABASE,
    provider="Docker",
    description="Base columnar analytique (OLAP) ultra-rapide.",
    popular=False,
    tags=["OLAP", "Analytics"],
    is_active=True,
    image_repository="clickhouse/clickhouse-server",
    internal_port=8123,
    secret_env="CLICKHOUSE_PASSWORD",
    versions=[
        VersionSpec(version="25.3", is_default=True, is_lts=True, eol_date=None),
        VersionSpec(version="24.8", is_default=False, is_lts=True, eol_date=None),
    ],
    params=[
        _db_name_param("default", 0),
        _port_param(8123),
        _password_param("Mot de passe", 2, required=True),
        _memory_param(1024, 3),
    ],
)


# --------------------------------------------------------------------------- #
# Cache & messaging (Docker)                                                   #
# --------------------------------------------------------------------------- #

_MEMCACHED = TemplateCommand(
    slug="memcached",
    name="Memcached",
    icon="server",
    category=TemplateCategory.CACHE,
    provider="Docker",
    description="Cache memoire distribue, simple et eprouve.",
    popular=False,
    tags=["Cache", "In-memory"],
    is_active=True,
    image_repository="memcached",
    internal_port=11211,
    secret_env=None,
    versions=[
        VersionSpec(version="1.6", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(11211, 0),
        _memory_param(256, 1),
    ],
)

_RABBITMQ = TemplateCommand(
    slug="rabbitmq",
    name="RabbitMQ",
    icon="send",
    category=TemplateCategory.CACHE,
    provider="Docker",
    description="Broker de messages AMQP fiable et mature.",
    popular=False,
    tags=["Messaging", "AMQP"],
    is_active=True,
    image_repository="rabbitmq",
    internal_port=5672,
    secret_env="RABBITMQ_DEFAULT_PASS",
    versions=[
        VersionSpec(version="4.0", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="3.13", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(5672, 0),
        _password_param("Mot de passe par defaut", 1, required=True),
        _memory_param(512, 2),
        _username_param("user", 3, env_var="RABBITMQ_DEFAULT_USER"),
    ],
)

_NATS = TemplateCommand(
    slug="nats",
    name="NATS",
    icon="send",
    category=TemplateCategory.CACHE,
    provider="Docker",
    description="Systeme de messaging cloud-native leger.",
    popular=False,
    tags=["Messaging", "PubSub"],
    is_active=True,
    image_repository="nats",
    internal_port=4222,
    secret_env=None,
    versions=[
        VersionSpec(version="2.10", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(4222, 0),
        _memory_param(256, 1),
    ],
)

_MOSQUITTO = TemplateCommand(
    slug="mosquitto",
    name="Mosquitto",
    icon="send",
    category=TemplateCategory.CACHE,
    provider="Docker",
    description="Broker MQTT leger pour l'IoT et l'embarque.",
    popular=False,
    tags=["Messaging", "MQTT"],
    is_active=True,
    image_repository="eclipse-mosquitto",
    internal_port=1883,
    secret_env=None,
    versions=[
        VersionSpec(version="2.0", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(1883, 0),
        _memory_param(128, 1),
    ],
)

_KAFKA = TemplateCommand(
    slug="kafka",
    name="Kafka",
    icon="send",
    category=TemplateCategory.CACHE,
    provider="Docker",
    description="Plateforme de streaming d'evenements distribuee.",
    popular=True,
    tags=["Messaging", "Streaming"],
    is_active=True,
    image_repository="apache/kafka",
    internal_port=9092,
    secret_env=None,
    versions=[
        VersionSpec(version="3.9.0", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="3.8.1", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(9092, 0),
        _memory_param(1024, 1),
    ],
)


# --------------------------------------------------------------------------- #
# Runtimes & web / proxy (Docker)                                             #
# --------------------------------------------------------------------------- #

_TRAEFIK = TemplateCommand(
    slug="traefik",
    name="Traefik",
    icon="globe",
    category=TemplateCategory.NETWORK,
    provider="Docker",
    description="Reverse proxy cloud-native avec decouverte auto.",
    popular=False,
    tags=["Proxy", "Ingress"],
    is_active=True,
    image_repository="traefik",
    internal_port=80,
    secret_env=None,
    versions=[
        VersionSpec(version="3.3", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="2.11", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(80, 0),
        _memory_param(256, 1),
    ],
)

_CADDY = TemplateCommand(
    slug="caddy",
    name="Caddy",
    icon="globe",
    category=TemplateCategory.NETWORK,
    provider="Docker",
    description="Serveur web avec HTTPS automatique (Let's Encrypt).",
    popular=False,
    tags=["Proxy", "TLS"],
    is_active=True,
    image_repository="caddy",
    internal_port=80,
    secret_env=None,
    versions=[
        VersionSpec(version="2.9", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="2.8", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(80, 0),
        _memory_param(256, 1),
    ],
)

_PHP = TemplateCommand(
    slug="php",
    name="Conteneur PHP",
    icon="box",
    category=TemplateCategory.RUNTIME,
    provider="Docker",
    description="Runtime PHP-FPM/Apache pret a deployer.",
    popular=False,
    tags=["Runtime", "PHP"],
    is_active=True,
    # Runtime langage : aucun service long-running utile au MVP -> visible mais bloque.
    is_deployable=False,
    image_repository="php",
    internal_port=80,
    secret_env=None,
    versions=[
        VersionSpec(version="8.4", is_default=True, is_lts=False, eol_date=date(2028, 12, 31)),
        VersionSpec(version="8.3", is_default=False, is_lts=False, eol_date=date(2027, 12, 31)),
    ],
    params=[
        _port_param(80, 0),
        _start_command_param("php-fpm", 1),
        _memory_param(512, 2),
    ],
)

_GOLANG = TemplateCommand(
    slug="golang",
    name="Conteneur Go",
    icon="box",
    category=TemplateCategory.RUNTIME,
    provider="Docker",
    description="Image Go pour compiler et lancer des binaires.",
    popular=False,
    tags=["Runtime", "Go"],
    is_active=True,
    # Runtime langage : aucun service long-running utile au MVP -> visible mais bloque.
    is_deployable=False,
    image_repository="golang",
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="1.24", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="1.23", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(8080, 0),
        _start_command_param("go run .", 1),
        _memory_param(512, 2),
    ],
)

_ADMINER = TemplateCommand(
    slug="adminer",
    name="Adminer",
    icon="database",
    category=TemplateCategory.RUNTIME,
    provider="Docker",
    description="Interface web de gestion de bases de donnees.",
    popular=False,
    tags=["Admin", "SQL"],
    is_active=True,
    image_repository="adminer",
    internal_port=8080,
    secret_env=None,
    versions=[
        VersionSpec(version="4.8.1", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(8080, 0),
        _start_command_param("php -S [::]:8080 -t /var/www/html", 1),
        _memory_param(256, 2),
    ],
)

_GITEA = TemplateCommand(
    slug="gitea",
    name="Gitea",
    icon="git-branch",
    category=TemplateCategory.RUNTIME,
    provider="Docker",
    description="Forge Git auto-hebergee, legere et complete.",
    popular=False,
    tags=["Git", "DevOps"],
    is_active=True,
    image_repository="gitea/gitea",
    internal_port=3000,
    secret_env=None,
    versions=[
        VersionSpec(version="1.23", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="1.22", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(3000, 0),
        _memory_param(512, 1),
    ],
)

_N8N = TemplateCommand(
    slug="n8n",
    name="n8n",
    icon="workflow",
    category=TemplateCategory.RUNTIME,
    provider="Docker",
    description="Automatisation de workflows low-code self-hosted.",
    popular=False,
    tags=["Automation", "Workflow"],
    is_active=True,
    image_repository="n8nio/n8n",
    internal_port=5678,
    secret_env=None,
    versions=[
        VersionSpec(version="1.80.5", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(5678, 0),
        _memory_param(512, 1),
    ],
)


# --------------------------------------------------------------------------- #
# Observabilite & securite (Docker)                                            #
# --------------------------------------------------------------------------- #

_GRAFANA = TemplateCommand(
    slug="grafana",
    name="Grafana",
    icon="bar-chart-3",
    category=TemplateCategory.OBSERVABILITY,
    provider="Docker",
    description="Dashboards et visualisation de metriques.",
    popular=True,
    tags=["Dashboards", "Metrics"],
    is_active=True,
    image_repository="grafana/grafana",
    internal_port=3000,
    secret_env="GF_SECURITY_ADMIN_PASSWORD",
    versions=[
        VersionSpec(version="11.5", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="10.4.19", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(3000, 0),
        _password_param("Mot de passe administrateur", 1, required=True),
        _memory_param(512, 2),
        _username_param("admin", 3, env_var="GF_SECURITY_ADMIN_USER"),
    ],
)

_PROMETHEUS = TemplateCommand(
    slug="prometheus",
    name="Prometheus",
    icon="activity",
    category=TemplateCategory.OBSERVABILITY,
    provider="Docker",
    description="Collecte et requetage de metriques time-series.",
    popular=True,
    tags=["Metrics", "Monitoring"],
    is_active=True,
    image_repository="prom/prometheus",
    internal_port=9090,
    secret_env=None,
    versions=[
        VersionSpec(version="v3.1.0", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="v2.55.0", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(9090, 0),
        _memory_param(512, 1),
    ],
)

_LOKI = TemplateCommand(
    slug="loki",
    name="Loki",
    icon="scroll-text",
    category=TemplateCategory.OBSERVABILITY,
    provider="Docker",
    description="Agregation de logs indexee par labels.",
    popular=False,
    tags=["Logs", "Monitoring"],
    is_active=True,
    image_repository="grafana/loki",
    internal_port=3100,
    secret_env=None,
    versions=[
        VersionSpec(version="3.4", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="3.3", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(3100, 0),
        _memory_param(512, 1),
    ],
)

_JAEGER = TemplateCommand(
    slug="jaeger",
    name="Jaeger",
    icon="route",
    category=TemplateCategory.OBSERVABILITY,
    provider="Docker",
    description="Tracing distribue pour microservices.",
    popular=False,
    tags=["Tracing", "Monitoring"],
    is_active=True,
    image_repository="jaegertracing/all-in-one",
    internal_port=16686,
    secret_env=None,
    versions=[
        VersionSpec(version="1.65.0", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(16686, 0),
        _memory_param(512, 1),
    ],
)

_UPTIME_KUMA = TemplateCommand(
    slug="uptime-kuma",
    name="Uptime Kuma",
    icon="activity",
    category=TemplateCategory.OBSERVABILITY,
    provider="Docker",
    description="Monitoring de disponibilite et alertes self-hosted.",
    popular=False,
    tags=["Monitoring", "Uptime"],
    is_active=True,
    image_repository="louislam/uptime-kuma",
    internal_port=3001,
    secret_env=None,
    versions=[
        VersionSpec(version="1.23.17", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(3001, 0),
        _memory_param(256, 1),
    ],
)

_MAILHOG = TemplateCommand(
    slug="mailhog",
    name="MailHog",
    icon="mail",
    category=TemplateCategory.OBSERVABILITY,
    provider="Docker",
    description="Serveur SMTP de test avec interface web.",
    popular=False,
    tags=["Email", "Testing"],
    is_active=True,
    image_repository="mailhog/mailhog",
    internal_port=8025,
    secret_env=None,
    versions=[
        VersionSpec(version="v1.0.1", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(8025, 0),
        _memory_param(128, 1),
    ],
)

_KEYCLOAK = TemplateCommand(
    slug="keycloak",
    name="Keycloak",
    icon="lock",
    category=TemplateCategory.SECURITY,
    provider="Docker",
    description="Gestion d'identite et d'acces (SSO, OIDC, SAML).",
    popular=True,
    tags=["SSO", "IAM"],
    is_active=True,
    image_repository="quay.io/keycloak/keycloak",
    internal_port=8080,
    secret_env="KEYCLOAK_ADMIN_PASSWORD",
    # Sans commande serveur, l'image Keycloak affiche l'aide et sort : on force `start-dev`.
    command=["start-dev"],
    versions=[
        VersionSpec(version="26.1", is_default=True, is_lts=False, eol_date=None),
        VersionSpec(version="25.0", is_default=False, is_lts=False, eol_date=None),
    ],
    params=[
        _port_param(8080, 0),
        _password_param("Mot de passe administrateur", 1, required=True),
        _memory_param(1024, 2),
        _username_param("admin", 3, env_var="KEYCLOAK_ADMIN"),
    ],
)


# --------------------------------------------------------------------------- #
# Infra / cloud — Terraform (cartes bloquees, sans image Docker)               #
# --------------------------------------------------------------------------- #

_KUBERNETES = TemplateCommand(
    slug="kubernetes",
    name="Cluster Kubernetes",
    icon="boxes",
    category=TemplateCategory.VM,
    provider="Terraform",
    description="Cluster Kubernetes manage, prets pour vos workloads.",
    popular=False,
    tags=["K8s", "Cluster"],
    is_active=True,
    engine=EngineKind.TERRAFORM,
    # Provisionne par Terraform (cluster), pas via une image Docker.
    image_repository=None,
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="v1", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        ParamSpec(
            key="cluster_name",
            label="Nom du cluster",
            type=ParamType.STRING,
            required=True,
            default_value="mon-cluster",
            options=None,
            order_index=0,
        ),
        ParamSpec(
            key="node_count",
            label="Nombre de noeuds",
            type=ParamType.INT,
            required=False,
            default_value="3",
            options=None,
            order_index=1,
        ),
    ],
)

_MANAGED_DATABASE = TemplateCommand(
    slug="managed-database",
    name="Base managee",
    icon="database",
    category=TemplateCategory.DATABASE,
    provider="Terraform",
    description="Base de donnees managee type RDS, backups inclus.",
    popular=False,
    tags=["Managed", "RDS"],
    is_active=True,
    engine=EngineKind.TERRAFORM,
    # Service manage provisionne par Terraform, pas une image Docker.
    image_repository=None,
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="v1", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        ParamSpec(
            key="engine",
            label="Moteur",
            type=ParamType.SELECT,
            required=True,
            default_value="postgres",
            options={"choices": ["postgres", "mysql", "mariadb"]},
            order_index=0,
        ),
        ParamSpec(
            key="instance_size",
            label="Taille d'instance",
            type=ParamType.SELECT,
            required=False,
            default_value="small",
            options={"choices": ["small", "medium", "large"]},
            order_index=1,
        ),
    ],
)

_LOAD_BALANCER = TemplateCommand(
    slug="load-balancer",
    name="Load Balancer",
    icon="network",
    category=TemplateCategory.NETWORK,
    provider="Terraform",
    description="Repartiteur de charge L4/L7 avec sante des cibles.",
    popular=False,
    tags=["LB", "Network"],
    is_active=True,
    engine=EngineKind.TERRAFORM,
    # Ressource reseau provisionnee par Terraform, pas un conteneur Docker.
    image_repository=None,
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="v1", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        ParamSpec(
            key="lb_name",
            label="Nom du load balancer",
            type=ParamType.STRING,
            required=True,
            default_value="mon-lb",
            options=None,
            order_index=0,
        ),
        ParamSpec(
            key="protocol",
            label="Protocole",
            type=ParamType.SELECT,
            required=False,
            default_value="http",
            options={"choices": ["http", "https", "tcp"]},
            order_index=1,
        ),
    ],
)

_DNS_ZONE = TemplateCommand(
    slug="dns-zone",
    name="Zone DNS",
    icon="globe",
    category=TemplateCategory.NETWORK,
    provider="Terraform",
    description="Zone DNS managee avec enregistrements versionnes.",
    popular=False,
    tags=["DNS", "Network"],
    is_active=True,
    engine=EngineKind.TERRAFORM,
    # Zone DNS provisionnee par Terraform, pas un conteneur Docker.
    image_repository=None,
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="v1", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        ParamSpec(
            key="domain_name",
            label="Nom de domaine",
            type=ParamType.STRING,
            required=True,
            default_value="exemple.com",
            options=None,
            order_index=0,
        ),
        ParamSpec(
            key="ttl",
            label="TTL par defaut (s)",
            type=ParamType.INT,
            required=False,
            default_value="3600",
            options=None,
            order_index=1,
        ),
    ],
)

_CDN = TemplateCommand(
    slug="cdn",
    name="CDN",
    icon="globe",
    category=TemplateCategory.NETWORK,
    provider="Terraform",
    description="Reseau de diffusion de contenu en peripherie.",
    popular=False,
    tags=["CDN", "Edge"],
    is_active=True,
    engine=EngineKind.TERRAFORM,
    # Distribution CDN provisionnee par Terraform, pas un conteneur Docker.
    image_repository=None,
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="v1", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        ParamSpec(
            key="origin_url",
            label="URL d'origine",
            type=ParamType.STRING,
            required=True,
            default_value="https://origin.exemple.com",
            options=None,
            order_index=0,
        ),
        ParamSpec(
            key="cache_ttl",
            label="Duree de cache (s)",
            type=ParamType.INT,
            required=False,
            default_value="86400",
            options=None,
            order_index=1,
        ),
    ],
)

_SERVERLESS_FUNCTION = TemplateCommand(
    slug="serverless-function",
    name="Fonction serverless",
    icon="zap",
    category=TemplateCategory.RUNTIME,
    provider="Terraform",
    description="Fonction a la demande, scaling automatique.",
    popular=False,
    tags=["Serverless", "FaaS"],
    is_active=True,
    engine=EngineKind.TERRAFORM,
    # Fonction managee provisionnee par Terraform, pas un conteneur Docker.
    image_repository=None,
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="v1", is_default=True, is_lts=False, eol_date=None),
    ],
    params=[
        ParamSpec(
            key="function_name",
            label="Nom de la fonction",
            type=ParamType.STRING,
            required=True,
            default_value="ma-fonction",
            options=None,
            order_index=0,
        ),
        ParamSpec(
            key="runtime",
            label="Runtime",
            type=ParamType.SELECT,
            required=False,
            default_value="python3.13",
            options={"choices": ["python3.13", "node20", "go1.24"]},
            order_index=1,
        ),
    ],
)


# Catalogue legitime de 45 templates (metadonnees publiques, aucune donnee
# utilisateur). Sert de jeu de donnees initial du store.
CATALOG_SEED: list[TemplateCommand] = [
    _POSTGRESQL,
    _REDIS,
    _MINIO,
    _UBUNTU,
    _NODE,
    _PYTHON,
    _NGINX,
    _VAULT,
    _ELK,
    _OLLAMA,
    _VPC,
    _S3,
    # Bases & data
    _MYSQL,
    _MARIADB,
    _MONGODB,
    _COUCHDB,
    _MEILISEARCH,
    _INFLUXDB,
    _NEO4J,
    _CLICKHOUSE,
    # Cache & messaging
    _MEMCACHED,
    _RABBITMQ,
    _NATS,
    _MOSQUITTO,
    _KAFKA,
    # Runtimes & web / proxy
    _TRAEFIK,
    _CADDY,
    _PHP,
    _GOLANG,
    _ADMINER,
    _GITEA,
    _N8N,
    # Observabilite & securite
    _GRAFANA,
    _PROMETHEUS,
    _LOKI,
    _JAEGER,
    _UPTIME_KUMA,
    _MAILHOG,
    _KEYCLOAK,
    # Infra / cloud — Terraform (bloques)
    _KUBERNETES,
    _MANAGED_DATABASE,
    _LOAD_BALANCER,
    _DNS_ZONE,
    _CDN,
    _SERVERLESS_FUNCTION,
]
