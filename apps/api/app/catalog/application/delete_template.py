"""Use case DeleteTemplate : suppression d'un template (reserve aux admins)."""

from uuid import UUID

from app.catalog.domain.exceptions.template_not_found import TemplateNotFoundException
from app.catalog.domain.interfaces.template_repository import TemplateRepository


class DeleteTemplate:
    """Supprime un template existant, ou leve 404 s'il est introuvable."""

    def __init__(self, repository: TemplateRepository) -> None:
        self._repository = repository

    async def execute(self, template_id: UUID) -> None:
        if await self._repository.get_by_id(template_id) is None:
            raise TemplateNotFoundException()
        await self._repository.delete(template_id)
