"""(De)serialisation d'un DeploymentJob vers un dict de primitives JSON.

Le job transite dans la file `arq` (Redis) sous forme d'arguments nommes ; on le
reduit donc a des primitives serialisables (str), sans donnee metier ni secret
(cf. design section 6 : le worker recharge le `Deployment` depuis le repository).
"""

from typing import Any
from uuid import UUID

from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.value_objects.deployment_job import DeploymentJob


def serialize_deployment_job(job: DeploymentJob) -> dict[str, str]:
    """Reduit le job a un dict de primitives JSON (cle `kind`, `deployment_id`)."""
    return {"kind": job.kind.value, "deployment_id": str(job.deployment_id)}


def deserialize_deployment_job(payload: dict[str, Any]) -> DeploymentJob:
    """Reconstruit un DeploymentJob depuis son dict serialise.

    Leve `ValueError` si le `kind` est inconnu ou l'`deployment_id` invalide.
    """
    return DeploymentJob(
        kind=JobKind(payload["kind"]),
        deployment_id=UUID(payload["deployment_id"]),
    )
