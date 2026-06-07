"""Insertion idempotente du catalogue de seed dans le depot de templates."""

from app.catalog.application.commands.template_command import TemplateCommand
from app.catalog.application.create_template import CreateTemplate
from app.catalog.domain.exceptions.slug_already_used import SlugAlreadyUsedException
from app.catalog.domain.interfaces.template_repository import TemplateRepository
from app.catalog.infrastructure.seed.catalog_seed import CATALOG_SEED


class CatalogSeeder:
    """Persiste les templates de seed manquants (idempotent : ignore l'existant).

    Reutilise le use case CreateTemplate pour beneficier du controle d'unicite
    du slug : un template deja present (meme slug) est simplement saute, ce qui
    rend le seeding rejouable sans dupliquer ni ecraser des donnees.
    """

    def __init__(self, repository: TemplateRepository) -> None:
        self._create_template = CreateTemplate(repository)

    async def seed(self, dataset: list[TemplateCommand] | None = None) -> int:
        """Insere les templates manquants et renvoie le nombre d'inserts effectues."""
        inserted = 0
        for command in dataset if dataset is not None else CATALOG_SEED:
            try:
                await self._create_template.execute(command)
                inserted += 1
            except SlugAlreadyUsedException:
                continue
        return inserted
