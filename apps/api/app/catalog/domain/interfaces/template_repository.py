"""Interface (port) du depot de templates du catalogue."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.catalog.domain.entities.template import Template
from app.catalog.domain.value_objects.slug import Slug


class TemplateRepository(ABC):
    """Contrat de persistance des templates du catalogue.

    Implemente en infrastructure par un adaptateur SQLAlchemy. Les use cases
    dependent de cette abstraction (inversion de dependance) : ils ignorent
    tout de la base et des modeles ORM. Les agregats renvoyes par `get_by_id`
    portent leurs versions et parametres ; `list_all` peut renvoyer des
    templates alleges (sans charger versions/params) pour la vue liste.
    """

    @abstractmethod
    async def list_all(self) -> list[Template]:
        """Renvoie tous les templates (vue liste, sans versions ni params)."""

    @abstractmethod
    async def get_by_id(self, template_id: UUID) -> Template | None:
        """Renvoie le template (avec versions + params) ou None s'il n'existe pas."""

    @abstractmethod
    async def get_by_slug(self, slug: Slug) -> Template | None:
        """Renvoie le template portant ce slug, ou None (controle d'unicite)."""

    @abstractmethod
    async def add(self, template: Template) -> Template:
        """Persiste un nouveau template (et ses versions/params) puis le renvoie."""

    @abstractmethod
    async def update(self, template: Template) -> Template:
        """Met a jour un template existant (et ses versions/params) puis le renvoie."""

    @abstractmethod
    async def delete(self, template_id: UUID) -> None:
        """Supprime le template (cascade sur versions/params via la FK)."""
