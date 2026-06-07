"""Tests unitaires du TemplateDTOMapper (entite -> DTO de lecture)."""

from uuid import uuid4

from app.catalog.domain.entities.template import Template
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.domain.value_objects.slug import Slug
from app.catalog.presentation.schemas.template_dto_mapper import TemplateDTOMapper


def _template(**overrides: object) -> Template:
    params: dict[str, object] = {
        "id": uuid4(),
        "slug": Slug("postgresql-16"),
        "name": "PostgreSQL",
        "icon": "database",
        "category": TemplateCategory.DATABASE,
        "provider": "Docker",
        "description": "Base relationnelle managee.",
        "popular": True,
        "tags": ["SQL"],
        "is_active": True,
        "versions": [],
        "params": [],
    }
    params.update(overrides)
    return Template(**params)  # type: ignore[arg-type]


class TestToDetailDescripteur:
    def test_expose_le_descripteur_de_provisioning(self) -> None:
        template = _template(
            image_repository="postgres",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
        )

        dto = TemplateDTOMapper.to_detail(template)

        assert dto.image_repository == "postgres"
        assert dto.internal_port == 5432
        assert dto.secret_env == "POSTGRES_PASSWORD"

    def test_descripteur_absent_reste_null(self) -> None:
        dto = TemplateDTOMapper.to_detail(_template())

        assert dto.image_repository is None
        assert dto.internal_port is None
        assert dto.secret_env is None


class TestToCardSansDescripteur:
    def test_la_carte_n_expose_pas_le_descripteur(self) -> None:
        template = _template(
            image_repository="postgres",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
        )

        card = TemplateDTOMapper.to_card(template)

        assert "image_repository" not in card.model_dump()
        assert "internal_port" not in card.model_dump()
        assert "secret_env" not in card.model_dump()
