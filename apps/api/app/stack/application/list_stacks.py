"""Use case ListStacks : liste les stacks d'un utilisateur (isolation owner)."""

from uuid import UUID

from app.stack.domain.entities.stack import Stack
from app.stack.domain.interfaces.stack_repository import StackRepository


class ListStacks:
    """Renvoie les stacks appartenant a un utilisateur (isolation par owner)."""

    def __init__(self, repository: StackRepository) -> None:
        self._repository = repository

    async def execute(self, owner_id: UUID) -> list[Stack]:
        return await self._repository.list_by_owner(owner_id)
