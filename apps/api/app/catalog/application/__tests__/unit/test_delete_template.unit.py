"""Tests unitaires du use case DeleteTemplate (avec fake repository)."""

from uuid import uuid4

import pytest

from app.catalog.application.__tests__.fakes import FakeTemplateRepository, make_template
from app.catalog.application.delete_template import DeleteTemplate
from app.catalog.domain.exceptions.template_not_found import TemplateNotFoundException


class TestDeleteTemplate:
    async def test_supprime_le_template_existant(self) -> None:
        template = make_template()
        repository = FakeTemplateRepository([template])
        use_case = DeleteTemplate(repository)

        await use_case.execute(template.id)

        assert template.id in repository.deleted

    async def test_template_inconnu_leve_not_found(self) -> None:
        repository = FakeTemplateRepository([])
        use_case = DeleteTemplate(repository)

        with pytest.raises(TemplateNotFoundException):
            await use_case.execute(uuid4())
