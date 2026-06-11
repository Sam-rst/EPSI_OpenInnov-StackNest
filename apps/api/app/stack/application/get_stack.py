"""Use case GetStack : detail d'une stack possedee (stack + services + liens)."""

from uuid import UUID

from app.stack.application.stack_access import load_owned_stack
from app.stack.domain.interfaces.stack_repository import StackRepository
from app.stack.domain.value_objects.stack_detail import StackDetail


class GetStack:
    """Compose la vue de detail d'une stack de l'utilisateur, ou leve 404.

    Verifie l'appartenance (`load_owned_stack`) puis assemble la vue agregee en
    chargeant separement les services (ordonnes) et les liens — l'agregat n'etant
    pas charge en une fois par le repository (cf. choix de chargement, evite le
    lazy-loading ORM en async). Une stack inexistante ou d'autrui leve la meme
    `StackNotFoundException` (on ne divulgue pas son existence).
    """

    def __init__(self, repository: StackRepository) -> None:
        self._repository = repository

    async def execute(self, stack_id: UUID, owner_id: UUID) -> StackDetail:
        stack = await load_owned_stack(self._repository, stack_id, owner_id)
        services = await self._repository.list_services(stack.id)
        links = await self._repository.list_links(stack.id)
        return StackDetail(stack=stack, services=tuple(services), links=tuple(links))
