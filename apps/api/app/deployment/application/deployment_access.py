"""Chargement d'un deploiement avec controle d'autorisation par proprietaire.

Helper applicatif partage par les use cases de lecture (`GetDeployment`) et de
cycle de vie (`StopDeployment`, `StartDeployment`, ...) : factorise la regle
« charger par id puis verifier l'appartenance a l'utilisateur ». Un deploiement
inexistant OU appartenant a un autre utilisateur leve la meme 404
(`DeploymentNotFoundException`) : on ne divulgue pas son existence (cf. design
section 8).
"""

from uuid import UUID

from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.exceptions.deployment_not_found import (
    DeploymentNotFoundException,
)
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository


async def load_owned_deployment(
    repository: DeploymentRepository, deployment_id: UUID, owner_id: UUID
) -> Deployment:
    """Charge le deploiement de cet owner, ou leve `DeploymentNotFoundException`."""
    deployment = await repository.get_by_id(deployment_id)
    if deployment is None or deployment.owner_id != owner_id:
        raise DeploymentNotFoundException()
    return deployment
