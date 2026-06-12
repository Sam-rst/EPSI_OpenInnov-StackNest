"""Interface (port) de delegation de la composition de stack depuis le chat."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.chat.domain.value_objects.stack_composition_spec import (
    StackLinkSpec,
    StackServiceSpec,
)


class StackActions(ABC):
    """Contrat de delegation au use case de composition de stack existant.

    Parallele a `DeploymentActions` : le moteur de chat ne reimplemente JAMAIS la
    logique de composition. A la confirmation d'une action `compose_stack`,
    `ConfirmAction` delegue a ce port, implemente en infrastructure par un
    adaptateur qui appelle le use case reel `CreateStack` du slice `stack`
    (validation + persistance + enfilage du provisioning via la `StackJobQueue`).
    Aucune duplication.

    `compose` renvoie l'identifiant (chaine, id opaque cote chat) de la stack
    creee, porte dans l'event SSE `action_result` (`stack_id`). Aucun secret n'est
    manipule : les params `secret` sont generes worker-side au provisioning.
    """

    @abstractmethod
    async def compose(
        self,
        *,
        owner_id: UUID,
        name: str,
        services: tuple[StackServiceSpec, ...],
        links: tuple[StackLinkSpec, ...],
    ) -> str:
        """Cree la stack (services + liens), enfile son provisioning, renvoie son id."""
