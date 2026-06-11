"""Tests unitaires de CatalogTemplateProvisioningReader (fake repo catalogue)."""

from uuid import uuid4

from app.catalog.application.__tests__.fakes import FakeTemplateRepository, make_template
from app.catalog.domain.entities.template import Template
from app.catalog.domain.entities.template_param import TemplateParam
from app.catalog.domain.entities.template_version import TemplateVersion
from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.param_type import ParamType
from app.deployment.infrastructure.reader.catalog_template_provisioning_reader import (
    CatalogTemplateProvisioningReader,
)


def _version(label: str) -> TemplateVersion:
    return TemplateVersion(id=uuid4(), version=label, is_default=True, is_lts=False, eol_date=None)


def _param(
    key: str,
    *,
    type: ParamType = ParamType.STRING,
    required: bool = False,
    options: dict[str, object] | None = None,
    env_var: str | None = None,
    default_value: str | None = None,
) -> TemplateParam:
    return TemplateParam(
        id=uuid4(),
        key=key,
        label=key.upper(),
        type=type,
        required=required,
        default_value=default_value,
        options=options,
        order_index=0,
        env_var=env_var,
    )


def _docker_template(*, versions: list[str], params: list[TemplateParam] | None = None) -> Template:
    template = make_template(versions=[_version(v) for v in versions], params=params)
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

    async def test_projette_le_nom_du_template(self) -> None:
        template = _docker_template(versions=["16"])
        template.name = "PostgreSQL"
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "16")

        assert descriptor is not None
        assert descriptor.template_name == "PostgreSQL"

    async def test_projette_les_parametres_du_template(self) -> None:
        params = [
            _param("db_name", required=True),
            _param("api_key", type=ParamType.SECRET, required=True),
        ]
        template = _docker_template(versions=["16"], params=params)
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "16")

        assert descriptor is not None
        keys = {spec.key for spec in descriptor.params}
        assert keys == {"db_name", "api_key"}
        assert descriptor.secret_param_keys() == frozenset({"api_key"})

    async def test_projette_la_variable_d_env_des_parametres(self) -> None:
        params = [
            _param("db_name", required=True, env_var="POSTGRES_DB"),
            _param("port", type=ParamType.INT),  # sans env_var
        ]
        template = _docker_template(versions=["16"], params=params)
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "16")

        assert descriptor is not None
        by_key = {spec.key: spec for spec in descriptor.params}
        assert by_key["db_name"].env_var == "POSTGRES_DB"
        assert by_key["port"].env_var is None

    async def test_projette_la_valeur_par_defaut_des_parametres(self) -> None:
        params = [
            _param("username", required=True, default_value="root"),
            _param("db_name", required=True),  # sans valeur par defaut
        ]
        template = _docker_template(versions=["16"], params=params)
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "16")

        assert descriptor is not None
        by_key = {spec.key: spec for spec in descriptor.params}
        assert by_key["username"].default_value == "root"
        assert by_key["db_name"].default_value is None

    async def test_descripteur_sans_parametre(self) -> None:
        template = _docker_template(versions=["16"])
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "16")

        assert descriptor is not None
        assert descriptor.params == ()


class TestCatalogTemplateProvisioningReaderModeleEtendu:
    """Projection des champs etendus command / secret_value_template / is_deployable."""

    async def test_projette_la_command(self) -> None:
        template = _docker_template(versions=["26.1"])
        template.command = ["start-dev"]
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "26.1")

        assert descriptor is not None
        assert descriptor.command == ("start-dev",)

    async def test_command_absente_reste_none(self) -> None:
        template = _docker_template(versions=["16"])
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "16")

        assert descriptor is not None
        assert descriptor.command is None

    async def test_projette_le_secret_value_template(self) -> None:
        template = _docker_template(versions=["5"])
        template.secret_value_template = "neo4j/{secret}"
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "5")

        assert descriptor is not None
        assert descriptor.secret_value_template == "neo4j/{secret}"

    async def test_projette_is_deployable_false(self) -> None:
        template = _docker_template(versions=["20"])
        template.is_deployable = False
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "20")

        assert descriptor is not None
        assert descriptor.is_deployable is False

    async def test_is_deployable_vrai_par_defaut(self) -> None:
        template = _docker_template(versions=["16"])
        reader = CatalogTemplateProvisioningReader(FakeTemplateRepository([template]))

        descriptor = await reader.get(template.id, "16")

        assert descriptor is not None
        assert descriptor.is_deployable is True
