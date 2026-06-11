"""Value object StackJob : unite de travail enfilee vers le worker de stack."""

from dataclasses import dataclass
from uuid import UUID

from app.stack.domain.enums.stack_job_kind import StackJobKind


@dataclass(frozen=True)
class StackJob:
    """Job minimal a traiter par le worker de stack (cf. spec « Provisioning »).

    Immutable : decrit l'action a executer (`kind`) sur une stack (`stack_id`).
    Le worker recharge la stack et ses membres depuis le repository a partir de
    cet identifiant — le job ne transporte aucune donnee metier, encore moins de
    secret (genere worker-side au provisioning).

    - `kind`     : nature de l'action (provision / destroy).
    - `stack_id` : identifiant de la stack cible.
    """

    kind: StackJobKind
    stack_id: UUID
