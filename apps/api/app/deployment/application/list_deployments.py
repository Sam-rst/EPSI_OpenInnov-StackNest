"""Use case ListDeployments : liste les deploiements d'un utilisateur."""

from uuid import UUID

from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository


class ListDeployments:
    """Renvoie les deploiements appartenant a un utilisateur (isolation owner)."""

    def __init__(self, repository: DeploymentRepository) -> None:
        self._repository = repository

    async def execute(self, owner_id: UUID) -> list[Deployment]:
        return await self._repository.list_by_owner(owner_id)
