"""(De)serialisation d'un StackJob vers un dict de primitives JSON.

Le job transite dans la file `arq` (Redis) sous forme d'arguments nommes ; on le
reduit a des primitives serialisables (str), sans donnee metier ni secret : le
worker recharge la stack depuis le repository a partir de l'identifiant.
"""

from typing import Any
from uuid import UUID

from app.stack.domain.enums.stack_job_kind import StackJobKind
from app.stack.domain.value_objects.stack_job import StackJob


def serialize_stack_job(job: StackJob) -> dict[str, str]:
    """Reduit le job a un dict de primitives JSON (cles `kind`, `stack_id`)."""
    return {"kind": job.kind.value, "stack_id": str(job.stack_id)}


def deserialize_stack_job(payload: dict[str, Any]) -> StackJob:
    """Reconstruit un StackJob depuis son dict serialise.

    Leve `ValueError` si le `kind` est inconnu ou le `stack_id` invalide.
    """
    return StackJob(
        kind=StackJobKind(payload["kind"]),
        stack_id=UUID(payload["stack_id"]),
    )
