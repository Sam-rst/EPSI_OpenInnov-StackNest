"""Tests unitaires du TemplateAssembler (Command -> entite Template)."""

from uuid import uuid4

from app.catalog.application.commands.template_command import TemplateCommand
from app.catalog.application.template_assembler import TemplateAssembler
from app.catalog.domain.enums.engine_kind import EngineKind
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


class TestTemplateAssemblerEngine:
    def test_propage_le_moteur_terraform(self) -> None:
        command = _command(engine=EngineKind.TERRAFORM)

        entity = TemplateAssembler.to_entity(uuid4(), command)

        assert entity.engine is EngineKind.TERRAFORM

    def test_propage_le_moteur_docker(self) -> None:
        command = _command(engine=EngineKind.DOCKER)

        entity = TemplateAssembler.to_entity(uuid4(), command)

        assert entity.engine is EngineKind.DOCKER


class TestTemplateAssemblerProvisioningV2:
    """Propagation des champs etendus command / secret_value_template / is_deployable."""

    def test_propage_la_command(self) -> None:
        entity = TemplateAssembler.to_entity(uuid4(), _command(command=["start-dev"]))

        assert entity.command == ["start-dev"]

    def test_propage_le_secret_value_template(self) -> None:
        entity = TemplateAssembler.to_entity(
            uuid4(), _command(secret_value_template="neo4j/{secret}")
        )

        assert entity.secret_value_template == "neo4j/{secret}"

    def test_propage_is_deployable_false(self) -> None:
        entity = TemplateAssembler.to_entity(uuid4(), _command(is_deployable=False))

        assert entity.is_deployable is False

    def test_is_deployable_true_par_defaut(self) -> None:
        entity = TemplateAssembler.to_entity(uuid4(), _command())

        assert entity.is_deployable is True
