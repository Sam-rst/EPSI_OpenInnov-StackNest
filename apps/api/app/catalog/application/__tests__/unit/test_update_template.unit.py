"""Tests unitaires du use case UpdateTemplate (avec fake repository)."""

from uuid import uuid4

import pytest

from app.catalog.application.__tests__.fakes import FakeTemplateRepository, make_template
from app.catalog.application.commands.template_command import (
    ParamSpec,
    TemplateCommand,
    VersionSpec,
)
from app.catalog.application.update_template import UpdateTemplate
from app.catalog.domain.enums.param_type import ParamType
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.domain.exceptions.slug_already_used import SlugAlreadyUsedException
from app.catalog.domain.exceptions.template_not_found import TemplateNotFoundException


def _command(slug: str = "postgresql-16") -> TemplateCommand:
    return TemplateCommand(
        slug=slug,
        name="PostgreSQL renomme",
        icon="database",
        category=TemplateCategory.DATABASE,
        provider="Docker",
        description="Description mise a jour.",
        popular=True,
        tags=["SQL"],
        is_active=True,
        versions=[VersionSpec(version="16", is_default=True, is_lts=False, eol_date=None)],
        params=[
            ParamSpec(
                key="db_name",
                label="Nom de la base",
                type=ParamType.STRING,
                required=True,
                default_value="app",
                options=None,
                order_index=0,
            )
        ],
    )


class TestUpdateTemplate:
    async def test_met_a_jour_le_template(self) -> None:
        existing = make_template(slug="postgresql-16")
        repository = FakeTemplateRepository([existing])
        use_case = UpdateTemplate(repository)

        result = await use_case.execute(existing.id, _command())

        assert result.name == "PostgreSQL renomme"
        assert len(result.params) == 1

    async def test_template_inconnu_leve_not_found(self) -> None:
        repository = FakeTemplateRepository([])
        use_case = UpdateTemplate(repository)

        with pytest.raises(TemplateNotFoundException):
            await use_case.execute(uuid4(), _command())

    async def test_slug_repris_par_un_autre_template_leve_conflit(self) -> None:
        target = make_template(slug="postgresql-16")
        other = make_template(slug="redis-7")
        repository = FakeTemplateRepository([target, other])
        use_case = UpdateTemplate(repository)

        with pytest.raises(SlugAlreadyUsedException):
            await use_case.execute(target.id, _command(slug="redis-7"))

    async def test_conserver_son_propre_slug_est_autorise(self) -> None:
        existing = make_template(slug="postgresql-16")
        repository = FakeTemplateRepository([existing])
        use_case = UpdateTemplate(repository)

        result = await use_case.execute(existing.id, _command(slug="postgresql-16"))

        assert str(result.slug) == "postgresql-16"
