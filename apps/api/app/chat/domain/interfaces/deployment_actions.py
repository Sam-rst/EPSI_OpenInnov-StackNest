"""Interface (port) de delegation des actions de deploiement depuis le chat."""

from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID


class DeploymentActions(ABC):
    """Contrat de delegation aux use cases de deploiement existants.

    Le moteur de chat ne reimplemente JAMAIS la logique de provisioning : a la
    confirmation d'une action, `ConfirmAction` delegue a ce port, implemente en
    infrastructure par un adaptateur qui appelle les use cases reels du slice
    `deployment` (`CreateDeployment`, `StopDeployment`, ...). Aucune duplication.

    Chaque methode renvoie l'identifiant de la ressource concernee (sous forme de
    chaine, id opaque cote chat), trace dans la `ChatAction` (`deployment_id`).
    """

    @abstractmethod
    async def deploy(
        self,
        *,
        owner_id: UUID,
        template_id: UUID,
        version: str,
        name: str,
        params: dict[str, Any],
    ) -> str:
        """Lance le provisioning d'un template puis renvoie l'id du deploiement cree."""

    @abstractmethod
    async def stop(self, *, owner_id: UUID, deployment_id: UUID) -> str:
        """Arrete un deploiement possede puis renvoie son id."""

    @abstractmethod
    async def start(self, *, owner_id: UUID, deployment_id: UUID) -> str:
        """Redemarre un deploiement possede puis renvoie son id."""

    @abstractmethod
    async def regenerate_password(self, *, owner_id: UUID, deployment_id: UUID) -> str:
        """Regenere le secret d'un deploiement possede puis renvoie son id."""
