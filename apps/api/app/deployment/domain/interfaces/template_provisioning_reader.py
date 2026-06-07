"""Interface (port) de lecture du descripteur de provisioning d'un template."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.deployment.domain.value_objects.template_provisioning import TemplateProvisioning


class TemplateProvisioningReader(ABC):
    """Contrat de lecture du descripteur de provisioning d'un template.

    Port du domaine deploiement (inversion de dependance) : les use cases
    interrogent ce reader pour connaitre l'image/port/secret/moteur d'un template
    sans dependre du slice catalogue. Implemente en infrastructure par un
    adaptateur qui lit le repository catalogue (`CatalogTemplateProvisioningReader`).
    """

    @abstractmethod
    async def get(self, template_id: UUID, version: str) -> TemplateProvisioning | None:
        """Renvoie le descripteur du template pour cette version, ou None si absent.

        `None` couvre le template introuvable et la version inconnue : le use
        case traduit ce cas en erreur metier (template/version invalide).
        """
