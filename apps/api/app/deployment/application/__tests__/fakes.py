"""Faux objets et constructeurs partages par les tests des use cases deploiement.

Module importable en absolu (nom non pointe, contrairement aux fichiers de test
`test_*.unit.py`) : resolu a la fois par pytest (importlib) et par mypy.
"""

from uuid import UUID, uuid4

from app.catalog.domain.enums.engine_kind import EngineKind
from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository
from app.deployment.domain.interfaces.job_queue import JobQueue
from app.deployment.domain.interfaces.secret_generator import SecretGenerator
from app.deployment.domain.interfaces.template_provisioning_reader import (
    TemplateProvisioningReader,
)
from app.deployment.domain.value_objects.deployment_job import DeploymentJob
from app.deployment.domain.value_objects.template_param_spec import TemplateParamSpec
from app.deployment.domain.value_objects.template_provisioning import TemplateProvisioning


class FakeDeploymentRepository(DeploymentRepository):
    """Depot de deploiements en memoire pour les tests unitaires des use cases."""

    def __init__(self, deployments: list[Deployment] | None = None) -> None:
        self._by_id: dict[UUID, Deployment] = {d.id: d for d in (deployments or [])}
        self.added: list[Deployment] = []
        self.updated: list[Deployment] = []

    async def add(self, deployment: Deployment) -> Deployment:
        self._by_id[deployment.id] = deployment
        self.added.append(deployment)
        return deployment

    async def get_by_id(self, deployment_id: UUID) -> Deployment | None:
        return self._by_id.get(deployment_id)

    async def list_by_owner(self, owner_id: UUID) -> list[Deployment]:
        return [d for d in self._by_id.values() if d.owner_id == owner_id]

    async def update(self, deployment: Deployment) -> Deployment:
        self._by_id[deployment.id] = deployment
        self.updated.append(deployment)
        return deployment


class FakeJobQueue(JobQueue):
    """File de jobs en memoire : enregistre les jobs enfiles pour assertion."""

    def __init__(self) -> None:
        self.enqueued: list[DeploymentJob] = []

    async def enqueue(self, job: DeploymentJob) -> None:
        self.enqueued.append(job)


class FakeTemplateProvisioningReader(TemplateProvisioningReader):
    """Reader en memoire du descripteur de provisioning d'un template."""

    def __init__(
        self, descriptors: dict[tuple[UUID, str], TemplateProvisioning] | None = None
    ) -> None:
        self._descriptors: dict[tuple[UUID, str], TemplateProvisioning] = descriptors or {}

    async def get(self, template_id: UUID, version: str) -> TemplateProvisioning | None:
        return self._descriptors.get((template_id, version))


class StubSecretGenerator(SecretGenerator):
    """Generateur de secret deterministe pour les tests."""

    def __init__(self, secret: str = "generated-secret") -> None:
        self._secret = secret
        self.calls = 0

    def generate(self) -> str:
        self.calls += 1
        return self._secret


def make_deployment(
    *,
    owner_id: UUID | None = None,
    template_id: UUID | None = None,
    template_version: str = "16",
    name: str = "ma-base",
    status: DeploymentStatus = DeploymentStatus.RUNNING,
    host: str | None = "host-b",
    published_port: int | None = 32768,
    container_ref: str | None = "container-abc",
    extra_params: dict[str, object] | None = None,
) -> Deployment:
    """Construit un Deployment valide pour les tests.

    `container_ref` est porte dans `params['container_ref']` (convention worker)
    afin que les use cases de cycle de vie disposent de la reference du conteneur
    a passer au provisioner. `extra_params` permet de simuler les valeurs de
    configuration saisies par l'utilisateur (ex. `{"db_name": "mabase"}`).
    """
    params: dict[str, object] = dict(extra_params or {})
    if container_ref is not None:
        params["container_ref"] = container_ref
    return Deployment(
        id=uuid4(),
        owner_id=owner_id or uuid4(),
        template_id=template_id or uuid4(),
        template_version=template_version,
        name=name,
        status=status,
        params=params,
        host=host,
        published_port=published_port,
    )


def docker_descriptor(
    *,
    image_repository: str = "postgres",
    internal_port: int | None = 5432,
    secret_env: str | None = "POSTGRES_PASSWORD",
    template_name: str = "PostgreSQL",
    params: tuple[TemplateParamSpec, ...] = (),
    command: tuple[str, ...] | None = None,
    secret_value_template: str | None = None,
    is_deployable: bool = True,
) -> TemplateProvisioning:
    """Descripteur de provisioning Docker valide pour les tests."""
    return TemplateProvisioning(
        image_repository=image_repository,
        internal_port=internal_port,
        secret_env=secret_env,
        engine=EngineKind.DOCKER,
        template_name=template_name,
        params=params,
        command=command,
        secret_value_template=secret_value_template,
        is_deployable=is_deployable,
    )


def non_deployable_descriptor() -> TemplateProvisioning:
    """Descripteur Docker marque non deployable (runtime bloque dans le catalogue)."""
    return docker_descriptor(
        image_repository="node",
        internal_port=None,
        secret_env=None,
        template_name="Conteneur Node.js",
        is_deployable=False,
    )


def terraform_descriptor() -> TemplateProvisioning:
    """Descripteur d'un template Terraform (rejete par la gate moteur)."""
    return TemplateProvisioning(
        image_repository=None,
        internal_port=None,
        secret_env=None,
        engine=EngineKind.TERRAFORM,
    )
