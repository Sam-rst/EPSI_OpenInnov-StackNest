"""Tests unitaires du TemplateAssembler (Command -> entite Template)."""

from uuid import uuid4

from app.catalog.application.commands.template_command import TemplateCommand
from app.catalog.application.template_assembler import TemplateAssembler
from app.catalog.domain.enums.template_category import TemplateCategory


def _command(**overrides: object) -> TemplateCommand:
    params: dict[str, object] = {
        "slug": "postgresql-16",
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
    return TemplateCommand(**params)  # type: ignore[arg-type]


class TestTemplateAssemblerProvisioning:
    def test_propage_le_descripteur_de_provisioning(self) -> None:
        command = _command(
            image_repository="postgres",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
        )

        entity = TemplateAssembler.to_entity(uuid4(), command)

        assert entity.image_repository == "postgres"
        assert entity.internal_port == 5432
        assert entity.secret_env == "POSTGRES_PASSWORD"

    def test_descripteur_absent_par_defaut(self) -> None:
        entity = TemplateAssembler.to_entity(uuid4(), _command())

        assert entity.image_repository is None
        assert entity.internal_port is None
        assert entity.secret_env is None
