"""Tests unitaires de l'entite Template (guards metier + agregat)."""

from uuid import uuid4

import pytest

from app.catalog.domain.entities.template import Template
from app.catalog.domain.entities.template_param import TemplateParam
from app.catalog.domain.entities.template_version import TemplateVersion
from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.param_type import ParamType
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.domain.value_objects.slug import Slug


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
        "tags": ["SQL", "Persistant"],
        "is_active": True,
        "versions": [],
        "params": [],
    }
    params.update(overrides)
    return Template(**params)  # type: ignore[arg-type]


class TestTemplateValide:
    def test_construction_nominale(self) -> None:
        template = _template()

        assert template.name == "PostgreSQL"
        assert template.category is TemplateCategory.DATABASE
        assert str(template.slug) == "postgresql-16"

    def test_agregat_porte_versions_et_params(self) -> None:
        version = TemplateVersion(
            id=uuid4(), version="16", is_default=True, is_lts=False, eol_date=None
        )
        param = TemplateParam(
            id=uuid4(),
            key="port",
            label="Port",
            type=ParamType.INT,
            required=False,
            default_value="5432",
            options=None,
            order_index=0,
        )
        template = _template(versions=[version], params=[param])

        assert template.versions == [version]
        assert template.params == [param]


class TestTemplateProvisioningDescriptor:
    def test_descripteur_absent_par_defaut(self) -> None:
        template = _template()

        assert template.image_repository is None
        assert template.internal_port is None
        assert template.secret_env is None

    def test_descripteur_renseigne(self) -> None:
        template = _template(
            image_repository="postgres",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
        )

        assert template.image_repository == "postgres"
        assert template.internal_port == 5432
        assert template.secret_env == "POSTGRES_PASSWORD"

    def test_secret_env_optionnel_meme_avec_image(self) -> None:
        template = _template(image_repository="redis", internal_port=6379, secret_env=None)

        assert template.image_repository == "redis"
        assert template.internal_port == 6379
        assert template.secret_env is None


class TestTemplateEngine:
    def test_engine_docker_par_defaut(self) -> None:
        template = _template()

        assert template.engine is EngineKind.DOCKER

    def test_engine_terraform_explicite(self) -> None:
        template = _template(engine=EngineKind.TERRAFORM)

        assert template.engine is EngineKind.TERRAFORM


class TestTemplateGuards:
    def test_name_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _template(name="")

    def test_icon_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _template(icon="  ")

    def test_provider_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _template(provider="")

    def test_description_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _template(description="")
