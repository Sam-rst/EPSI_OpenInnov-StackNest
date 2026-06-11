"""Interface (port) de lecture d'un template du catalogue pour la composition."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.stack.domain.value_objects.stack_template_ref import StackTemplateRef


class StackTemplateReader(ABC):
    """Contrat de lecture d'un template/version pour la composition d'une stack.

    Port du domaine stack (inversion de dependance) : le use case `CreateStack`
    interroge ce reader pour verifier que chaque service reference un template et
    une version reels et ajoutables (moteur Docker), sans dependre du slice
    catalogue. Implemente en infrastructure par un adaptateur adosse au repository
    catalogue (`CatalogStackTemplateReader`) — meme pattern que le
    `TemplateProvisioningReader` du deploiement.
    """

    @abstractmethod
    async def get(self, template_id: UUID, version: str) -> StackTemplateRef | None:
        """Renvoie la reference du template pour cette version, ou None si absent.

        `None` couvre le template introuvable et la version inconnue : le use
        case traduit ce cas en erreur metier (template/version invalide).
        """
