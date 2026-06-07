"""Tests unitaires du use case CreateTemplate (avec fake repository)."""

import pytest

from app.catalog.application.__tests__.fakes import FakeTemplateRepository, make_template
from app.catalog.application.commands.template_command import (
    TemplateCommand,
    VersionSpec,
)
from app.catalog.application.create_template import CreateTemplate
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.domain.exceptions.slug_already_used import SlugAlreadyUsedException


def _command(slug: str = "minio") -> TemplateCommand:
    return TemplateCommand(
        slug=slug,
        name="MinIO",
        icon="hard-drive",
        category=TemplateCategory.STORAGE,
        provider="Docker",
        description="Stockage objet compatible S3.",
        popular=False,
        tags=["S3", "Object"],
        is_active=True,
        versions=[
            VersionSpec(version="RELEASE.2024", is_default=True, is_lts=False, eol_date=None)
        ],
        params=[],
    )


class TestCreateTemplate:
    async def test_cree_un_template_avec_id_genere(self) -> None:
        repository = FakeTemplateRepository([])
        use_case = CreateTemplate(repository)

        result = await use_case.execute(_command())

        assert result.id is not None
        assert str(result.slug) == "minio"
        assert len(result.versions) == 1

    async def test_slug_deja_utilise_leve_conflit(self) -> None:
        existing = make_template(slug="minio")
        repository = FakeTemplateRepository([existing])
        use_case = CreateTemplate(repository)

        with pytest.raises(SlugAlreadyUsedException):
            await use_case.execute(_command(slug="minio"))
