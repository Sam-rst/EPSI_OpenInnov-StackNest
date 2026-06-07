"""Tests unitaires du use case GetTemplateDetail (avec fake repository)."""

from uuid import uuid4

import pytest

from app.catalog.application.__tests__.fakes import FakeTemplateRepository, make_template
from app.catalog.application.get_template_detail import GetTemplateDetail
from app.catalog.domain.exceptions.template_not_found import TemplateNotFoundException


class TestGetTemplateDetail:
    async def test_renvoie_le_template_existant(self) -> None:
        template = make_template()
        use_case = GetTemplateDetail(FakeTemplateRepository([template]))

        result = await use_case.execute(template.id)

        assert result.id == template.id

    async def test_template_inconnu_leve_not_found(self) -> None:
        use_case = GetTemplateDetail(FakeTemplateRepository([]))

        with pytest.raises(TemplateNotFoundException):
            await use_case.execute(uuid4())
