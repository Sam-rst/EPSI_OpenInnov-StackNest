"""Tests unitaires du ComposeBuilder : generation du compose-file + resolution liens.

Le builder est pur (aucune I/O) : il transforme une stack + ses services + liens
+ descripteurs catalogue + secrets generes en un `ComposeFile` (YAML). On teste
par **snapshot** du YAML genere (lisible, deterministe) et la **resolution des
var_mappings** (cas BDD -> app, CA1 de la spec).
"""

from uuid import UUID, uuid4

import yaml

from app.catalog.domain.enums.engine_kind import EngineKind
from app.deployment.domain.value_objects.template_provisioning import TemplateProvisioning
from app.stack.domain.entities.stack_link import StackLink
from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.services.compose_builder import ComposeBuilder

_STACK_ID = UUID("11111111-1111-1111-1111-111111111111")


def _service(*, alias: str, order: int, params: dict[str, object] | None = None) -> StackService:
    return StackService(
        id=uuid4(),
        stack_id=_STACK_ID,
        template_id=uuid4(),
        version="16" if alias == "db" else "1.0",
        alias=alias,
        service_status=ServiceStatus.PENDING,
        order_index=order,
        params=dict(params or {}),
    )


def _postgres_provisioning() -> TemplateProvisioning:
    return TemplateProvisioning(
        image_repository="postgres",
        internal_port=5432,
        secret_env="POSTGRES_PASSWORD",
        engine=EngineKind.DOCKER,
        template_name="PostgreSQL",
    )


def _app_provisioning() -> TemplateProvisioning:
    return TemplateProvisioning(
        image_repository="myapp",
        internal_port=8080,
        secret_env=None,
        engine=EngineKind.DOCKER,
        template_name="Mon API",
    )


class TestComposeBuilderSnapshot:
    def test_genere_un_compose_file_complet_pour_db_plus_app_liee(self) -> None:
        db = _service(alias="db", order=0, params={"db_name": "appdb"})
        app = _service(alias="api", order=1)
        link = StackLink(
            id=uuid4(),
            stack_id=_STACK_ID,
            from_service_id=app.id,
            to_service_id=db.id,
            var_mappings={
                "DB_HOST": "{to.alias}",
                "DB_PORT": "{to.port}",
                "DB_PASSWORD": "{to.secret}",
                "DB_USER": "{to.username}",
                "DB_NAME": "{to.db_name}",
            },
        )

        compose = ComposeBuilder().build(
            stack_id=_STACK_ID,
            services=[db, app],
            links=[link],
            provisioning_by_alias={"db": _postgres_provisioning(), "api": _app_provisioning()},
            secret_by_alias={"db": "S3CR3T", "api": None},
        )

        assert compose.project_name == "stack_11111111-1111-1111-1111-111111111111"
        document = yaml.safe_load(compose.content)

        # Reseau bridge commun.
        assert document["networks"] == {"stack_net": {"driver": "bridge"}}

        # Service fournisseur : image taguee, secret injecte, port publie, reseau.
        db_service = document["services"]["db"]
        assert db_service["image"] == "postgres:16"
        assert db_service["environment"]["POSTGRES_PASSWORD"] == "S3CR3T"
        assert db_service["ports"] == ["5432"]
        assert db_service["networks"] == ["stack_net"]
        assert "depends_on" not in db_service

        # Service consommateur : vars du lien resolues + depends_on fournisseur.
        api_service = document["services"]["api"]
        assert api_service["image"] == "myapp:1.0"
        assert api_service["environment"] == {
            "DB_HOST": "db",
            "DB_PORT": "5432",
            "DB_PASSWORD": "S3CR3T",
            "DB_USER": "postgres",
            "DB_NAME": "appdb",
        }
        assert api_service["depends_on"] == ["db"]
        assert api_service["ports"] == ["8080"]

    def test_service_sans_port_interne_ne_publie_aucun_port(self) -> None:
        worker = _service(alias="worker", order=0)
        provisioning = TemplateProvisioning(
            image_repository="busybox",
            internal_port=None,
            secret_env=None,
            engine=EngineKind.DOCKER,
            template_name="Worker",
        )

        compose = ComposeBuilder().build(
            stack_id=_STACK_ID,
            services=[worker],
            links=[],
            provisioning_by_alias={"worker": provisioning},
            secret_by_alias={"worker": None},
        )

        document = yaml.safe_load(compose.content)
        assert "ports" not in document["services"]["worker"]


class TestComposeBuilderSecurity:
    def test_aucun_secret_dans_un_service_sans_secret_env(self) -> None:
        # L'app n'a pas de secret_env : on n'injecte aucun secret, meme fourni.
        app = _service(alias="api", order=0)

        compose = ComposeBuilder().build(
            stack_id=_STACK_ID,
            services=[app],
            links=[],
            provisioning_by_alias={"api": _app_provisioning()},
            secret_by_alias={"api": "ne-doit-pas-apparaitre"},
        )

        assert "ne-doit-pas-apparaitre" not in compose.content
