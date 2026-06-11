"""Insertion convergente (upsert) du catalogue de seed dans le depot de templates."""

from app.catalog.application.commands.template_command import TemplateCommand
from app.catalog.application.create_template import CreateTemplate
from app.catalog.application.template_assembler import TemplateAssembler
from app.catalog.application.update_template import UpdateTemplate
from app.catalog.domain.entities.template import Template
from app.catalog.domain.interfaces.template_repository import TemplateRepository
from app.catalog.domain.value_objects.slug import Slug
from app.catalog.infrastructure.seed.catalog_seed import CATALOG_SEED
from app.catalog.infrastructure.seed.seed_outcome import SeedOutcome

_Snapshot = tuple[object, ...]


class CatalogSeeder:
    """Fait converger le catalogue persiste vers `CATALOG_SEED` (upsert par slug).

    Pour chaque entree du seed : insere le template si son slug est absent, sinon
    met a jour le template existant *en place* (memes champs, versions et params)
    sans changer son `id`. L'identite stable est cruciale : des deploiements
    peuvent referencer un template, on matche donc par `slug` et on reutilise
    l'`id` deja persiste. Le seeding est convergent et idempotent : un re-run sans
    evolution du seed est un no-op (aucune ecriture), un seed enrichi (nouveau
    param, `env_var` modifie...) reactualise le template existant.
    """

    def __init__(self, repository: TemplateRepository) -> None:
        self._repository = repository
        self._create_template = CreateTemplate(repository)
        self._update_template = UpdateTemplate(repository)

    async def seed(self, dataset: list[TemplateCommand] | None = None) -> SeedOutcome:
        """Insere les templates absents, met a jour ceux qui different, renvoie le bilan."""
        inserted = 0
        updated = 0
        for command in dataset if dataset is not None else CATALOG_SEED:
            existing = await self._repository.get_by_slug(Slug(command.slug))
            if existing is None:
                await self._create_template.execute(command)
                inserted += 1
            elif self._differs(existing, command):
                await self._update_template.execute(existing.id, command)
                updated += 1
        return SeedOutcome(inserted=inserted, updated=updated)

    def _differs(self, existing: Template, command: TemplateCommand) -> bool:
        """Indique si le template persiste s'ecarte de l'etat cible (hors id/dates)."""
        target = TemplateAssembler.to_entity(existing.id, command)
        return self._snapshot(existing) != self._snapshot(target)

    @staticmethod
    def _snapshot(template: Template) -> _Snapshot:
        """Capture comparable d'un template, ignorant id de version/param et dates."""
        return (
            template.slug.value,
            template.name,
            template.icon,
            template.category,
            template.provider,
            template.description,
            template.popular,
            tuple(template.tags),
            template.is_active,
            template.engine,
            template.image_repository,
            template.internal_port,
            template.secret_env,
            None if template.command is None else tuple(template.command),
            template.secret_value_template,
            template.is_deployable,
            tuple(
                (version.version, version.is_default, version.is_lts, version.eol_date)
                for version in template.versions
            ),
            tuple(
                (
                    param.key,
                    param.label,
                    param.type,
                    param.required,
                    param.default_value,
                    None if param.options is None else tuple(sorted(param.options.items())),
                    param.order_index,
                    param.env_var,
                )
                for param in template.params
            ),
        )
