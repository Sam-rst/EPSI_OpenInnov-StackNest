"""Tests unitaires du use case ListTemplates (avec fake repository)."""

from app.catalog.application.__tests__.fakes import FakeTemplateRepository, make_template
from app.catalog.application.list_templates import ListTemplates


class TestListTemplates:
    async def test_renvoie_tous_les_templates(self) -> None:
        repository = FakeTemplateRepository(
            [make_template(slug="postgresql-16"), make_template(slug="redis-7")]
        )
        use_case = ListTemplates(repository)

        result = await use_case.execute()

        assert len(result) == 2

    async def test_catalogue_vide_renvoie_liste_vide(self) -> None:
        use_case = ListTemplates(FakeTemplateRepository([]))

        result = await use_case.execute()

        assert result == []
