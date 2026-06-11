"""Chargement d'une stack avec controle d'autorisation par proprietaire.

Helper applicatif partage par les use cases de lecture (`GetStack`) et de cycle
de vie (`DestroyStack`) : factorise la regle « charger par id puis verifier
l'appartenance a l'utilisateur ». Une stack inexistante OU appartenant a un autre
utilisateur leve la meme 404 (`StackNotFoundException`) : on ne divulgue pas son
existence (cf. design, section « Securite » — isolation par owner).
"""

from uuid import UUID

from app.stack.domain.entities.stack import Stack
from app.stack.domain.exceptions.stack_not_found import StackNotFoundException
from app.stack.domain.interfaces.stack_repository import StackRepository


async def load_owned_stack(repository: StackRepository, stack_id: UUID, owner_id: UUID) -> Stack:
    """Charge la stack de cet owner, ou leve `StackNotFoundException`."""
    stack = await repository.get_by_id(stack_id)
    if stack is None or stack.owner_id != owner_id:
        raise StackNotFoundException()
    return stack
