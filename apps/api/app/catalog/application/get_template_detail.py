"""Use case GetTemplateDetail : detail riche d'un template (versions + params)."""

from uuid import UUID

from app.catalog.domain.entities.template import Template
from app.catalog.domain.exceptions.template_not_found import TemplateNotFoundException
from app.catalog.domain.interfaces.template_repository import TemplateRepository


class GetTemplateDetail:
    """Renvoie un template avec ses versions et parametres, ou leve 404."""

    def __init__(self, repository: TemplateRepository) -> None:
        self._repository = repository

    async def execute(self, template_id: UUID) -> Template:
        template = await self._repository.get_by_id(template_id)
        if template is None:
            raise TemplateNotFoundException()
        return template
