"""Interface (port) du depot de deploiements."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.deployment.domain.entities.deployment import Deployment


class DeploymentRepository(ABC):
    """Contrat de persistance des deploiements (source de verite Postgres).

    Implemente en infrastructure par un adaptateur SQLAlchemy. Les use cases en
    dependent par inversion : ils ignorent tout des modeles ORM. `list_by_owner`
    renvoie les deploiements d'un utilisateur (isolation par `owner_id` —
    cf. design section 8).
    """

    @abstractmethod
    async def add(self, deployment: Deployment) -> Deployment:
        """Persiste un nouveau deploiement (etat initial `pending`) puis le renvoie."""

    @abstractmethod
    async def get_by_id(self, deployment_id: UUID) -> Deployment | None:
        """Renvoie le deploiement par son id, ou None s'il n'existe pas."""

    @abstractmethod
    async def list_by_owner(self, owner_id: UUID) -> list[Deployment]:
        """Renvoie tous les deploiements appartenant a cet utilisateur."""

    @abstractmethod
    async def update(self, deployment: Deployment) -> Deployment:
        """Met a jour un deploiement existant (statut, host, port) puis le renvoie."""
