"""Tests unitaires du DTO de reponse `DeploymentResponse`.

Verifie le mapping entite -> DTO et l'invariant de securite central du slice :
le secret du deploiement n'est jamais expose dans une reponse REST (il ne
voyage que dans le flux SSE, diffuse une seule fois).
"""

from uuid import uuid4

from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.param_type import ParamType
from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.value_objects.template_param_spec import TemplateParamSpec
from app.deployment.domain.value_objects.template_provisioning import TemplateProvisioning
from app.deployment.presentation.schemas.deployment_response import DeploymentResponse


def _deployment(**overrides: object) -> Deployment:
    base: dict[str, object] = {
        "id": uuid4(),
        "owner_id": uuid4(),
        "template_id": uuid4(),
        "template_version": "16",
        "name": "ma-base",
        "status": DeploymentStatus.RUNNING,
        "params": {"db_name": "app"},
        "host": "host-b",
        "published_port": 32768,
    }
    base.update(overrides)
    return Deployment(**base)  # type: ignore[arg-type]


def _provisioning(
    *,
    template_name: str = "PostgreSQL",
    params: tuple[TemplateParamSpec, ...] = (),
) -> TemplateProvisioning:
    return TemplateProvisioning(
        image_repository="postgres",
        internal_port=5432,
        secret_env="POSTGRES_PASSWORD",
        engine=EngineKind.DOCKER,
        template_name=template_name,
        params=params,
    )


class TestDeploymentResponse:
    def test_mappe_les_champs_de_l_entite(self) -> None:
        deployment = _deployment()

        dto = DeploymentResponse.from_entity(deployment)

        assert dto.id == deployment.id
        assert dto.template_id == deployment.template_id
        assert dto.template_version == "16"
        assert dto.name == "ma-base"
        assert dto.status == DeploymentStatus.RUNNING
        assert dto.params == {"db_name": "app"}
        assert dto.host == "host-b"
        assert dto.published_port == 32768

    def test_construit_l_access_url_quand_host_et_port_presents(self) -> None:
        dto = DeploymentResponse.from_entity(_deployment(host="host-b", published_port=32768))

        assert dto.access_url == "host-b:32768"

    def test_access_url_absent_avant_publication_du_port(self) -> None:
        dto = DeploymentResponse.from_entity(
            _deployment(status=DeploymentStatus.PENDING, host=None, published_port=None)
        )

        assert dto.access_url is None

    def test_n_expose_jamais_de_champ_secret(self) -> None:
        dto = DeploymentResponse.from_entity(_deployment())

        assert "secret" not in dto.model_dump()

    def test_template_name_vide_sans_descripteur(self) -> None:
        dto = DeploymentResponse.from_entity(_deployment())

        assert dto.template_name is None


class TestTemplateName:
    def test_expose_le_nom_du_template_resolu(self) -> None:
        dto = DeploymentResponse.from_entity(
            _deployment(), provisioning=_provisioning(template_name="PostgreSQL")
        )

        assert dto.template_name == "PostgreSQL"


class TestSecretMasking:
    def test_masque_la_valeur_d_un_param_secret(self) -> None:
        specs = (
            TemplateParamSpec(key="db_name", type=ParamType.STRING, required=True, options=None),
            TemplateParamSpec(key="api_key", type=ParamType.SECRET, required=True, options=None),
        )
        deployment = _deployment(params={"db_name": "app", "api_key": "super-secret"})

        dto = DeploymentResponse.from_entity(deployment, provisioning=_provisioning(params=specs))

        assert dto.params["db_name"] == "app"
        assert dto.params["api_key"] != "super-secret"
        assert "super-secret" not in str(dto.model_dump())

    def test_ne_reexpose_pas_la_valeur_secrete_meme_partiellement(self) -> None:
        specs = (
            TemplateParamSpec(key="api_key", type=ParamType.SECRET, required=True, options=None),
        )
        deployment = _deployment(params={"api_key": "valeur-tres-sensible-1234"})

        dto = DeploymentResponse.from_entity(deployment, provisioning=_provisioning(params=specs))

        assert "valeur-tres-sensible-1234" not in str(dto.params["api_key"])

    def test_laisse_intacts_les_params_non_secret(self) -> None:
        specs = (
            TemplateParamSpec(key="db_name", type=ParamType.STRING, required=True, options=None),
        )
        deployment = _deployment(params={"db_name": "app"})

        dto = DeploymentResponse.from_entity(deployment, provisioning=_provisioning(params=specs))

        assert dto.params == {"db_name": "app"}

    def test_param_secret_absent_des_valeurs_ne_pose_pas_de_probleme(self) -> None:
        specs = (
            TemplateParamSpec(key="api_key", type=ParamType.SECRET, required=True, options=None),
        )
        deployment = _deployment(params={"db_name": "app"})

        dto = DeploymentResponse.from_entity(deployment, provisioning=_provisioning(params=specs))

        assert "api_key" not in dto.params
        assert dto.params == {"db_name": "app"}
