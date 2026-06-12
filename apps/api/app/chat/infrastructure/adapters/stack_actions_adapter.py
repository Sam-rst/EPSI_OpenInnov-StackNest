"""Adaptateur du port StackActions : delegue au use case de composition de stack.

A la confirmation d'une action `compose_stack`, `ConfirmAction` appelle ce port.
L'unique role de l'adaptateur est de traduire la composition validee (specs de
services / liens portees par le chat) en `StackCreateCommand`, puis d'invoquer le
use case REEL `CreateStack` du slice `stack` — AUCUNE duplication de la logique
de composition (validation structurelle, persistance, enfilage du provisioning
via la `StackJobQueue`). Le secret n'est jamais manipule ici (genere worker-side).
"""

from uuid import UUID

from app.chat.domain.interfaces.stack_actions import StackActions
from app.chat.domain.value_objects.stack_composition_spec import (
    StackLinkSpec,
    StackServiceSpec,
)
from app.stack.application.commands.stack_create_command import StackCreateCommand
from app.stack.application.commands.stack_link_command import StackLinkCommand
from app.stack.application.commands.stack_service_command import StackServiceCommand
from app.stack.application.create_stack import CreateStack
from app.stack.domain.interfaces.stack_job_queue import StackJobQueue
from app.stack.domain.interfaces.stack_repository import StackRepository
from app.stack.domain.interfaces.stack_template_reader import StackTemplateReader


class StackActionsAdapter(StackActions):
    """Delegue la composition de stack au use case existant `CreateStack`."""

    def __init__(
        self,
        *,
        repository: StackRepository,
        queue: StackJobQueue,
        reader: StackTemplateReader,
    ) -> None:
        self._repository = repository
        self._queue = queue
        self._reader = reader

    async def compose(
        self,
        *,
        owner_id: UUID,
        name: str,
        services: tuple[StackServiceSpec, ...],
        links: tuple[StackLinkSpec, ...],
    ) -> str:
        command = StackCreateCommand(
            owner_id=owner_id,
            name=name,
            services=tuple(
                self._to_service_command(service, index) for index, service in enumerate(services)
            ),
            links=tuple(self._to_link_command(link) for link in links),
        )
        stack = await CreateStack(
            repository=self._repository, reader=self._reader, queue=self._queue
        ).execute(command)
        return str(stack.id)

    @staticmethod
    def _to_service_command(service: StackServiceSpec, order_index: int) -> StackServiceCommand:
        return StackServiceCommand(
            template_id=service.template_id,
            version=service.version,
            alias=service.alias,
            order_index=order_index,
            params=dict(service.params),
        )

    @staticmethod
    def _to_link_command(link: StackLinkSpec) -> StackLinkCommand:
        return StackLinkCommand(
            from_alias=link.from_alias,
            to_alias=link.to_alias,
            var_mappings=dict(link.var_mappings),
        )
