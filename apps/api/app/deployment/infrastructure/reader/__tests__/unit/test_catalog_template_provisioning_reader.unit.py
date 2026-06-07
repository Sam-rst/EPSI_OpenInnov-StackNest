"""Tests unitaires de CatalogTemplateProvisioningReader (fake repo catalogue)."""

from uuid import uuid4

from app.catalog.application.__tests__.fakes import FakeTemplateRepository, make_template
from app.catalog.domain.entities.template import Template
from app.catalog.domain.entities.template_version import TemplateVersion
from app.catalog.domain.enums.engine_kind import EngineKind
from app.deployment.infrastructure.reader.catalog_template_provisioning_reader import (
    CatalogTemplateProvisioningReader,
)


def _version(label: str) -> TemplateVersion:
    return TemplateVersion(id=uuid4(), version=label, is_default=True, is_lts=False, eol_date=None)


def _docker_template(*, versions: list[str]) -> Template:
    template = make_template(versions=[_version(v) for v in versions])
    template.engine = EngineKind.DOCKER
    template.image_repository = "postgres"
    template.internal_port = 5432
    template.secret_env = "POSTGRES_PASSWORD"
    return template


class TestCatalogTemplateProvisioningReader:
    async def test_renvoie_le_descripteur_pour_une_version_connue(self) -> None:
        template = _docker_template(versions=["16", "15"])
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "16")

        assert descriptor is not None
        assert descriptor.image_repository == "postgres"
        assert descriptor.internal_port == 5432
        assert descriptor.secret_env == "POSTGRES_PASSWORD"
        assert descriptor.engine is EngineKind.DOCKER

    async def test_renvoie_none_si_template_absent(self) -> None:
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([]))

        descriptor = await reader.get(uuid4(), "16")

        assert descriptor is None

    async def test_renvoie_none_si_version_inconnue(self) -> None:
        template = _docker_template(versions=["16"])
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "99")

        assert descriptor is None

    async def test_reporte_le_moteur_terraform(self) -> None:
        template = make_template(versions=[_version("1.0")])
        template.engine = EngineKind.TERRAFORM
        template.image_repository = None
        template.internal_port = None
        template.secret_env = None
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "1.0")

        assert descriptor is not None
        assert descriptor.engine is EngineKind.TERRAFORM
        assert descriptor.is_docker() is False
