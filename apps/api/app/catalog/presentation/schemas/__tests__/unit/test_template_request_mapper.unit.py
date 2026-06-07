"""Tests unitaires du TemplateRequestMapper (requete HTTP -> commande)."""

from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.presentation.schemas.template_request_mapper import TemplateRequestMapper
from app.catalog.presentation.schemas.template_write_request import TemplateWriteRequest


def _request(**overrides: object) -> TemplateWriteRequest:
    payload: dict[str, object] = {
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
    payload.update(overrides)
    return TemplateWriteRequest(**payload)  # type: ignore[arg-type]


class TestRequestMapperProvisioning:
    def test_propage_le_descripteur_vers_la_commande(self) -> None:
        request = _request(
            image_repository="postgres",
            internal_port=5432,
            secret_env="POSTGRES_PASSWORD",
        )

        command = TemplateRequestMapper.to_command(request)

        assert command.image_repository == "postgres"
        assert command.internal_port == 5432
        assert command.secret_env == "POSTGRES_PASSWORD"

    def test_descripteur_optionnel_par_defaut(self) -> None:
        command = TemplateRequestMapper.to_command(_request())

        assert command.image_repository is None
        assert command.internal_port is None
        assert command.secret_env is None


class TestRequestMapperEngine:
    def test_propage_le_moteur_vers_la_commande(self) -> None:
        request = _request(engine=EngineKind.TERRAFORM)

        command = TemplateRequestMapper.to_command(request)

        assert command.engine is EngineKind.TERRAFORM

    def test_moteur_docker_par_defaut(self) -> None:
        command = TemplateRequestMapper.to_command(_request())

        assert command.engine is EngineKind.DOCKER
