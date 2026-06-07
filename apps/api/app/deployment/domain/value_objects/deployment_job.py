"""Value object DeploymentJob : unite de travail enfilee vers le worker."""

from dataclasses import dataclass
from uuid import UUID

from app.deployment.domain.enums.job_kind import JobKind


@dataclass(frozen=True)
class DeploymentJob:
    """Job minimal a traiter par le worker (cf. design section 6).

    Immutable : decrit l'action a executer (`kind`) sur un deploiement
    (`deployment_id`). Le worker recharge le `Deployment` depuis le repository a
    partir de cet identifiant — le job ne transporte aucune donnee metier, encore
    moins de secret.

    - `kind`          : nature de l'action (provision / stop / start / ...).
    - `deployment_id` : identifiant du deploiement cible.
    """

    kind: JobKind
    deployment_id: UUID
