"""Faux objets partages par les tests des handlers worker de deploiement.

Module importable en absolu (resolu par pytest importlib et mypy). Fournit des
doubles pour le provisioner et le publisher d'events, plus des variantes
defaillantes pour tester la bascule en `failed`.
"""

from uuid import UUID

from app.deployment.domain.interfaces.event_publisher import EventPublisher
from app.deployment.domain.interfaces.provisioner import Provisioner
from app.deployment.domain.value_objects.container_spec import ContainerSpec
from app.deployment.domain.value_objects.deployment_event import DeploymentEvent
from app.deployment.domain.value_objects.provision_result import ProvisionResult
from app.deployment.infrastructure.provisioner.provisioning_exception import (
    ProvisioningException,
)


class FakeProvisioner(Provisioner):
    """Provisioner en memoire : enregistre les appels et renvoie un resultat fixe."""

    def __init__(
        self,
        *,
        result: ProvisionResult | None = None,
        logs_output: str = "",
    ) -> None:
        self._result = result or ProvisionResult(
            host="host-b", port=32768, container_ref="container-new"
        )
        self._logs_output = logs_output
        self.created: list[ContainerSpec] = []
        self.recreated: list[tuple[ContainerSpec, str]] = []
        self.started: list[str] = []
        self.stopped: list[str] = []
        self.destroyed: list[str] = []
        self.logs_calls: list[str] = []

    async def create(self, spec: ContainerSpec) -> ProvisionResult:
        self.created.append(spec)
        return self._result

    async def start(self, container_ref: str) -> ProvisionResult:
        self.started.append(container_ref)
        return self._result

    async def stop(self, container_ref: str) -> None:
        self.stopped.append(container_ref)

    async def destroy(self, container_ref: str) -> None:
        self.destroyed.append(container_ref)

    async def recreate(self, spec: ContainerSpec, container_ref: str) -> ProvisionResult:
        self.recreated.append((spec, container_ref))
        return self._result

    async def logs(self, container_ref: str) -> str:
        self.logs_calls.append(container_ref)
        return self._logs_output


class FailingProvisioner(FakeProvisioner):
    """Provisioner dont chaque operation echoue (test de la bascule `failed`)."""

    async def create(self, spec: ContainerSpec) -> ProvisionResult:
        raise ProvisioningException("create boom")

    async def start(self, container_ref: str) -> ProvisionResult:
        raise ProvisioningException("start boom")

    async def stop(self, container_ref: str) -> None:
        raise ProvisioningException("stop boom")

    async def destroy(self, container_ref: str) -> None:
        raise ProvisioningException("destroy boom")

    async def recreate(self, spec: ContainerSpec, container_ref: str) -> ProvisionResult:
        raise ProvisioningException("recreate boom")


class FakeEventPublisher(EventPublisher):
    """Publisher en memoire : capture les events publies par deploiement."""

    def __init__(self) -> None:
        self.events: list[tuple[UUID, DeploymentEvent]] = []

    async def publish(self, deployment_id: UUID, event: DeploymentEvent) -> None:
        self.events.append((deployment_id, event))

    def statuses(self) -> list[str]:
        """Liste ordonnee des statuts publies (pour assertion)."""
        return [event.status.value for _, event in self.events]

    def secrets(self) -> list[str]:
        """Secrets non nuls publies (doit n'apparaitre qu'une fois au running)."""
        return [event.secret for _, event in self.events if event.secret is not None]

    def messages(self) -> list[str]:
        """Messages non nuls publies (logs du conteneur, progression...)."""
        return [event.message for _, event in self.events if event.message is not None]
