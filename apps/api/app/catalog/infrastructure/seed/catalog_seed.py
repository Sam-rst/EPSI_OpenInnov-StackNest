"""Donnees de seed du catalogue : 12 templates reels (metadonnees publiques).

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
    return ParamSpec(
        key="memory_mb",
        label="Memoire allouee (Mo)",
        type=ParamType.INT,
        required=False,
        default_value=str(default_mb),
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
    secret_env=None,
    versions=[
        VersionSpec(version="RELEASE.2025-04-22", is_default=True, is_lts=False, eol_date=None),
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
    image_repository="node",
    internal_port=None,
    secret_env=None,
    versions=[
        VersionSpec(version="20 LTS", is_default=True, is_lts=True, eol_date=date(2026, 4, 30)),
        VersionSpec(version="22 LTS", is_default=False, is_lts=True, eol_date=date(2027, 4, 30)),
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
        VersionSpec(version="0.5", is_default=True, is_lts=False, eol_date=None),
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


# Catalogue legitime de 12 templates (metadonnees publiques, aucune donnee
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
]
