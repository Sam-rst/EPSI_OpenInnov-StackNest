"""Use case UpdateTemplate : mise a jour d'un template (reserve aux admins)."""

from uuid import UUID

from app.catalog.application.commands.template_command import TemplateCommand
from app.catalog.application.template_assembler import TemplateAssembler
from app.catalog.domain.entities.template import Template
from app.catalog.domain.exceptions.slug_already_used import SlugAlreadyUsedException
from app.catalog.domain.exceptions.template_not_found import TemplateNotFoundException
from app.catalog.domain.interfaces.template_repository import TemplateRepository
from app.catalog.domain.value_objects.slug import Slug


class UpdateTemplate:
    """Met a jour un template existant (verifie l'existence puis l'unicite du slug)."""

    def __init__(self, repository: TemplateRepository) -> None:
        self._repository = repository

    async def execute(self, template_id: UUID, command: TemplateCommand) -> Template:
        if await self._repository.get_by_id(template_id) is None:
            raise TemplateNotFoundException()
        await self._ensure_slug_available(template_id, Slug(command.slug))
        template = TemplateAssembler.to_entity(template_id, command)
        return await self._repository.update(template)

    async def _ensure_slug_available(self, template_id: UUID, slug: Slug) -> None:
        owner = await self._repository.get_by_slug(slug)
        if owner is not None and owner.id != template_id:
            raise SlugAlreadyUsedException()
