"""Faux objets et constructeurs partages par les tests des use cases stack.

Module importable en absolu (nom non pointe, contrairement aux fichiers de test
`test_*.unit.py`) : resolu a la fois par pytest (importlib) et par mypy. Fournit
un depot de stacks en memoire et un reader de templates en memoire, plus des
constructeurs de commandes valides.
"""

from uuid import UUID, uuid4

from app.catalog.domain.enums.engine_kind import EngineKind
from app.stack.application.commands.stack_create_command import StackCreateCommand
from app.stack.application.commands.stack_link_command import StackLinkCommand
from app.stack.application.commands.stack_service_command import StackServiceCommand
from app.stack.domain.entities.stack import Stack
from app.stack.domain.entities.stack_link import StackLink
from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.interfaces.stack_repository import StackRepository
from app.stack.domain.interfaces.stack_template_reader import StackTemplateReader
from app.stack.domain.value_objects.stack_template_ref import StackTemplateRef


class FakeStackRepository(StackRepository):
    """Depot de stacks / services / liens en memoire pour les tests des use cases.

    Reproduit le contrat du `StackRepository` sans base : stocke les entites par
    id, expose les listes filtrees (`list_by_owner`, `list_services`,
    `list_links`) et la suppression en cascade. Conserve les sequences `added_*`
    pour les assertions des tests (ce qui a ete persiste).
    """

    def __init__(self, stacks: list[Stack] | None = None) -> None:
        self._stacks: dict[UUID, Stack] = {s.id: s for s in (stacks or [])}
        self._services: dict[UUID, StackService] = {}
        self._links: dict[UUID, StackLink] = {}
        self.added_stacks: list[Stack] = []
        self.added_services: list[StackService] = []
        self.added_links: list[StackLink] = []
        self.deleted: list[UUID] = []

    async def add(self, stack: Stack) -> Stack:
        self._stacks[stack.id] = stack
        self.added_stacks.append(stack)
        return stack

    async def get_by_id(self, stack_id: UUID) -> Stack | None:
        return self._stacks.get(stack_id)

    async def list_by_owner(self, owner_id: UUID) -> list[Stack]:
        return [s for s in self._stacks.values() if s.owner_id == owner_id]

    async def delete(self, stack_id: UUID) -> None:
        self._stacks.pop(stack_id, None)
        self._services = {
            sid: svc for sid, svc in self._services.items() if svc.stack_id != stack_id
        }
        self._links = {lid: lk for lid, lk in self._links.items() if lk.stack_id != stack_id}
        self.deleted.append(stack_id)

    async def add_service(self, service: StackService) -> StackService:
        self._services[service.id] = service
        self.added_services.append(service)
        return service

    async def list_services(self, stack_id: UUID) -> list[StackService]:
        services = [s for s in self._services.values() if s.stack_id == stack_id]
        return sorted(services, key=lambda s: s.order_index)

    async def add_link(self, link: StackLink) -> StackLink:
        self._links[link.id] = link
        self.added_links.append(link)
        return link

    async def list_links(self, stack_id: UUID) -> list[StackLink]:
        return [link for link in self._links.values() if link.stack_id == stack_id]


class FakeStackTemplateReader(StackTemplateReader):
    """Reader en memoire d'une reference de template (existence + moteur)."""

    def __init__(self, refs: dict[tuple[UUID, str], StackTemplateRef] | None = None) -> None:
        self._refs: dict[tuple[UUID, str], StackTemplateRef] = refs or {}

    async def get(self, template_id: UUID, version: str) -> StackTemplateRef | None:
        return self._refs.get((template_id, version))


def docker_ref(template_name: str = "PostgreSQL") -> StackTemplateRef:
    """Reference d'un template Docker ajoutable a une stack."""
    return StackTemplateRef(template_name=template_name, engine=EngineKind.DOCKER)


def terraform_ref(template_name: str = "Machine virtuelle") -> StackTemplateRef:
    """Reference d'un template Terraform (non ajoutable a une stack)."""
    return StackTemplateRef(template_name=template_name, engine=EngineKind.TERRAFORM)


def make_service_command(
    *,
    template_id: UUID,
    alias: str,
    version: str = "16",
    order_index: int = 0,
    params: dict[str, object] | None = None,
) -> StackServiceCommand:
    """Construit une sous-commande de service valide pour les tests."""
    return StackServiceCommand(
        template_id=template_id,
        version=version,
        alias=alias,
        order_index=order_index,
        params=dict(params or {}),
    )


def make_create_command(
    *,
    owner_id: UUID | None = None,
    name: str = "ma-stack",
    services: tuple[StackServiceCommand, ...],
    links: tuple[StackLinkCommand, ...] = (),
) -> StackCreateCommand:
    """Construit une commande de creation de stack pour les tests."""
    return StackCreateCommand(
        owner_id=owner_id or uuid4(),
        name=name,
        services=services,
        links=links,
    )
