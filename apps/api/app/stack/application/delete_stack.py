"""Use case DeleteStack : supprime une stack possedee (cascade services + liens)."""

from uuid import UUID

from app.stack.application.stack_access import load_owned_stack
from app.stack.domain.interfaces.stack_repository import StackRepository


class DeleteStack:
    """Verifie l'owner puis supprime la stack en base (cascade services + liens).

    Une stack inexistante ou n'appartenant pas a l'utilisateur leve 404
    (`StackNotFoundException`) sans rien supprimer. Au lot 2, la suppression est
    purement en base : la destruction reelle des conteneurs et volumes
    (`compose down -v`) viendra au lot 3 (worker). Le repository ne commit pas
    (unit of work par requete cote appelant).
    """

    def __init__(self, repository: StackRepository) -> None:
        self._repository = repository

    async def execute(self, stack_id: UUID, owner_id: UUID) -> None:
        stack = await load_owned_stack(self._repository, stack_id, owner_id)
        await self._repository.delete(stack.id)
