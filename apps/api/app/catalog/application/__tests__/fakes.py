"""Faux objets et constructeurs partages par les tests des use cases catalogue.

Module importable en absolu (nom non pointe, contrairement aux fichiers de test
`test_*.unit.py`) : il est resolu a la fois par pytest (importlib) et par mypy.
"""

from uuid import UUID, uuid4

from app.catalog.domain.entities.template import Template
from app.catalog.domain.entities.template_param import TemplateParam
from app.catalog.domain.entities.template_version import TemplateVersion
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.domain.interfaces.template_repository import TemplateRepository
from app.catalog.domain.value_objects.slug import Slug


class FakeTemplateRepository(TemplateRepository):
    """Depot de templates en memoire pour les tests unitaires des use cases."""

    def __init__(self, templates: list[Template] | None = None) -> None:
        self._by_id: dict[UUID, Template] = {t.id: t for t in (templates or [])}
        self.deleted: list[UUID] = []

    async def list_all(self) -> list[Template]:
        return list(self._by_id.values())

    async def get_by_id(self, template_id: UUID) -> Template | None:
        return self._by_id.get(template_id)

    async def get_by_slug(self, slug: Slug) -> Template | None:
        for template in self._by_id.values():
            if template.slug == slug:
                return template
        return None

    async def add(self, template: Template) -> Template:
        self._by_id[template.id] = template
        return template

    async def update(self, template: Template) -> Template:
        self._by_id[template.id] = template
        return template

    async def delete(self, template_id: UUID) -> None:
        self.deleted.append(template_id)
        self._by_id.pop(template_id, None)


def make_template(
    *,
    slug: str = "postgresql-16",
    name: str = "PostgreSQL",
    versions: list[TemplateVersion] | None = None,
    params: list[TemplateParam] | None = None,
) -> Template:
    """Construit un Template valide pour les tests."""
    return Template(
        id=uuid4(),
        slug=Slug(slug),
        name=name,
        icon="database",
        category=TemplateCategory.DATABASE,
        provider="Docker",
        description="Base relationnelle managee.",
        popular=True,
        tags=["SQL"],
        is_active=True,
        versions=versions or [],
        params=params or [],
    )
