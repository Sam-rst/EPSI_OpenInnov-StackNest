"""Faux objets partages par les tests du handler de job worker de stack.

Module importable en absolu (resolu par pytest importlib et mypy). Fournit des
doubles pour le provisioner compose et le publisher d'events, plus une variante
defaillante pour tester la bascule en `failed`.
"""

from uuid import UUID

from app.stack.domain.interfaces.stack_event_publisher import StackEventPublisher
from app.stack.domain.interfaces.stack_provisioner import StackProvisioner
from app.stack.domain.value_objects.compose_file import ComposeFile
from app.stack.domain.value_objects.service_provision_result import ServiceProvisionResult
from app.stack.domain.value_objects.stack_event import StackEvent


class FakeStackProvisioner(StackProvisioner):
    """Provisioner compose en memoire : enregistre les appels, renvoie un resultat fixe."""

    def __init__(self, *, results: list[ServiceProvisionResult] | None = None) -> None:
        self._results = results
        self.up_calls: list[ComposeFile] = []
        self.down_calls: list[str] = []

    async def up(self, compose_file: ComposeFile) -> list[ServiceProvisionResult]:
        self.up_calls.append(compose_file)
        return self._results if self._results is not None else []

    async def down(self, project_name: str) -> None:
        self.down_calls.append(project_name)


class FailingStackProvisioner(FakeStackProvisioner):
    """Provisioner dont chaque operation echoue (test de la bascule `failed`)."""

    async def up(self, compose_file: ComposeFile) -> list[ServiceProvisionResult]:
        raise RuntimeError("compose up boom")

    async def down(self, project_name: str) -> None:
        raise RuntimeError("compose down boom")


class FakeStackEventPublisher(StackEventPublisher):
    """Publisher en memoire : capture les events publies par stack."""

    def __init__(self) -> None:
        self.events: list[tuple[UUID, StackEvent]] = []

    async def publish(self, stack_id: UUID, event: StackEvent) -> None:
        self.events.append((stack_id, event))

    def stack_statuses(self) -> list[str]:
        """Statuts des events de niveau stack (alias None), dans l'ordre."""
        return [event.stack_status.value for _, event in self.events if event.alias is None]

    def service_events(self) -> list[StackEvent]:
        """Events de niveau service (alias renseigne)."""
        return [event for _, event in self.events if event.alias is not None]
