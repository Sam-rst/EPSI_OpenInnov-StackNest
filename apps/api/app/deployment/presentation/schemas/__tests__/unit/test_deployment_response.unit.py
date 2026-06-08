"""Tests unitaires du DTO de reponse `DeploymentResponse`.

Verifie le mapping entite -> DTO et l'invariant de securite central du slice :
le secret du deploiement n'est jamais expose dans une reponse REST (il ne
voyage que dans le flux SSE, diffuse une seule fois).
"""

from uuid import uuid4

from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
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
