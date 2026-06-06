"""Use case CreateTemplate : creation d'un template (reserve aux admins)."""

from uuid import uuid4

from app.catalog.application.commands.template_command import TemplateCommand
from app.catalog.application.template_assembler import TemplateAssembler
from app.catalog.domain.entities.template import Template
from app.catalog.domain.exceptions.slug_already_used import SlugAlreadyUsedException
from app.catalog.domain.interfaces.template_repository import TemplateRepository
from app.catalog.domain.value_objects.slug import Slug


class CreateTemplate:
    """Cree un template a partir d'une commande, apres controle d'unicite du slug."""

    def __init__(self, repository: TemplateRepository) -> None:
        self._repository = repository

    async def execute(self, command: TemplateCommand) -> Template:
        slug = Slug(command.slug)
        if await self._repository.get_by_slug(slug) is not None:
            raise SlugAlreadyUsedException()
        template = TemplateAssembler.to_entity(uuid4(), command)
        return await self._repository.add(template)
