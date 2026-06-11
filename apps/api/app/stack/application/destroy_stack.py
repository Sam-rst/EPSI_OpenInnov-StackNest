"""Use case DestroyStack : enfile la destruction d'une stack possedee (compose down)."""

from uuid import UUID

from app.stack.application.stack_access import load_owned_stack
from app.stack.domain.enums.stack_job_kind import StackJobKind
from app.stack.domain.interfaces.stack_job_queue import StackJobQueue
from app.stack.domain.interfaces.stack_repository import StackRepository
from app.stack.domain.value_objects.stack_job import StackJob


class DestroyStack:
    """Verifie l'owner puis enfile un job DESTROY (worker `docker compose down -v`).

    Une stack inexistante ou n'appartenant pas a l'utilisateur leve 404
    (`StackNotFoundException`) sans rien enfiler. La destruction est asynchrone :
    le worker detruit les conteneurs et volumes (`compose down -v`), passe la
    stack en `destroying` puis `destroyed`, et publie les events SSE. La ligne en
    base est conservee (historique) ; le repository ne commit pas (unit of work
    par requete cote appelant).
    """

    def __init__(self, *, repository: StackRepository, queue: StackJobQueue) -> None:
        self._repository = repository
        self._queue = queue

    async def execute(self, stack_id: UUID, owner_id: UUID) -> None:
        stack = await load_owned_stack(self._repository, stack_id, owner_id)
        await self._queue.enqueue(StackJob(kind=StackJobKind.DESTROY, stack_id=stack.id))
