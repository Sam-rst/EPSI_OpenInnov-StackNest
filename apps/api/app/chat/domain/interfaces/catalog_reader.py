"""Interface (port) de lecture du catalogue pour le moteur de chat."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.catalog.domain.entities.template import Template


class CatalogReader(ABC):
    """Contrat de lecture du catalogue consomme par le moteur de chat.

    Le slice chat ne connait que ce port : il ignore tout du repository
    SQLAlchemy du catalogue. L'adaptateur d'infrastructure delegue au
    `TemplateRepository` du catalogue (decouplage inter-slices).

    Sert a deux usages :
    - construire les `ToolDefinition` derives du catalogue reel (boite a outils
      fermee, 1re couche anti-hallucination) ;
    - alimenter la gate de validation des arguments d'action (2e couche) en
      rechargeant le template (avec ses versions et parametres) reference par un
      appel d'outil.
    """

    @abstractmethod
    async def list_templates(self) -> list[Template]:
        """Renvoie tous les templates (vue liste, sans versions ni params)."""

    @abstractmethod
    async def get_template(self, template_id: UUID) -> Template | None:
        """Renvoie le template (avec versions + params) ou None s'il est inconnu."""
