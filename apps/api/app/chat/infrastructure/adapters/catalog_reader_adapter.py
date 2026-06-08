"""Adaptateur du port CatalogReader adosse au repository catalogue.

Implemente le port de lecture du chat en deleguant au `TemplateRepository` du
catalogue : le slice chat reste decouple du catalogue (il ne connait que son
port). Aucune logique ici, simple transfert.
"""

from uuid import UUID

from app.catalog.domain.entities.template import Template
from app.catalog.domain.interfaces.template_repository import TemplateRepository
from app.chat.domain.interfaces.catalog_reader import CatalogReader


class CatalogReaderAdapter(CatalogReader):
    """Lit le catalogue pour le moteur de chat via le repository du catalogue."""

    def __init__(self, repository: TemplateRepository) -> None:
        self._repository = repository

    async def list_templates(self) -> list[Template]:
        return await self._repository.list_all()

    async def get_template(self, template_id: UUID) -> Template | None:
        return await self._repository.get_by_id(template_id)
