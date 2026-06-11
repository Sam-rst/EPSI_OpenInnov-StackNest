"""Use case CreateStack : valide puis persiste une stack multi-services."""

from uuid import UUID, uuid4

from app.stack.application.commands.stack_create_command import StackCreateCommand
from app.stack.domain.entities.stack import Stack
from app.stack.domain.entities.stack_link import StackLink
from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.exceptions.invalid_stack import InvalidStackException
from app.stack.domain.interfaces.stack_repository import StackRepository
from app.stack.domain.interfaces.stack_template_reader import StackTemplateReader
from app.stack.domain.services.stack_validator import StackValidator


class CreateStack:
    """Cree une stack `pending` (services + liens) apres validation, sans deployer.

    Ordre de validation, AVANT toute persistance (aucune stack invalide n'est
    ecrite) :

    1. structure (`StackValidator`) : >= 1 service, alias uniques, liens vers des
       alias existants, pas d'auto-lien, graphe acyclique (sinon 422) ;
    2. catalogue (port `StackTemplateReader`) : chaque service reference un
       template/version reel et ajoutable (moteur Docker ; les Terraform sont
       bloques) — sinon 422.

    Puis persiste la stack, ses services (status `pending`, alias -> id memorise)
    et ses liens (alias resolus en ids de services). **Aucun provisioning n'est
    lance au lot 2** : la stack reste `pending` ; le worker `compose up` viendra au
    lot 3. Le repository ne commit pas (unit of work par requete cote appelant).
    """

    def __init__(
        self,
        *,
        repository: StackRepository,
        reader: StackTemplateReader,
        validator: StackValidator | None = None,
    ) -> None:
        self._repository = repository
        self._reader = reader
        self._validator = validator or StackValidator()

    async def execute(self, command: StackCreateCommand) -> Stack:
        self._validator.validate(command.services, command.links)
        await self._ensure_templates_addable(command)

        stack = await self._repository.add(self._new_stack(command))
        alias_to_id = await self._persist_services(stack.id, command)
        await self._persist_links(stack.id, command, alias_to_id)
        # TODO lot 3 : enfiler le provisioning (worker `compose up`) ici.
        return stack

    async def _ensure_templates_addable(self, command: StackCreateCommand) -> None:
        """Verifie l'existence et le moteur Docker de chaque template reference."""
        for service in command.services:
            ref = await self._reader.get(service.template_id, service.version)
            if ref is None:
                raise InvalidStackException(
                    f"Le service « {service.alias} » reference un template ou une version "
                    "inconnu du catalogue."
                )
            if not ref.is_docker():
                raise InvalidStackException(
                    f"Le service « {service.alias} » ({ref.template_name}) n'est pas ajoutable "
                    "a une stack : seuls les templates Docker sont supportes."
                )

    @staticmethod
    def _new_stack(command: StackCreateCommand) -> Stack:
        return Stack(
            id=uuid4(),
            owner_id=command.owner_id,
            name=command.name,
            status=StackStatus.PENDING,
        )

    async def _persist_services(
        self, stack_id: UUID, command: StackCreateCommand
    ) -> dict[str, UUID]:
        alias_to_id: dict[str, UUID] = {}
        for service in command.services:
            persisted = await self._repository.add_service(
                StackService(
                    id=uuid4(),
                    stack_id=stack_id,
                    template_id=service.template_id,
                    version=service.version,
                    alias=service.alias,
                    service_status=ServiceStatus.PENDING,
                    order_index=service.order_index,
                    params=dict(service.params),
                )
            )
            alias_to_id[persisted.alias] = persisted.id
        return alias_to_id

    async def _persist_links(
        self, stack_id: UUID, command: StackCreateCommand, alias_to_id: dict[str, UUID]
    ) -> None:
        for link in command.links:
            await self._repository.add_link(
                StackLink(
                    id=uuid4(),
                    stack_id=stack_id,
                    from_service_id=alias_to_id[link.from_alias],
                    to_service_id=alias_to_id[link.to_alias],
                    var_mappings=dict(link.var_mappings),
                )
            )
