"""Use case GetDeployment : detail d'un deploiement appartenant a l'utilisateur."""

from uuid import UUID

from app.deployment.application.deployment_access import load_owned_deployment
from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository


class GetDeployment:
    """Renvoie un deploiement par id (controle d'owner), ou leve 404."""

    def __init__(self, repository: DeploymentRepository) -> None:
        self._repository = repository

    async def execute(self, deployment_id: UUID, owner_id: UUID) -> Deployment:
        return await load_owned_deployment(self._repository, deployment_id, owner_id)
