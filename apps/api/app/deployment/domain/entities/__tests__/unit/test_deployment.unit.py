"""Tests unitaires de l'entite Deployment (guards metier + helpers d'etat)."""

from uuid import uuid4

import pytest

from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus


def _deployment(**overrides: object) -> Deployment:
    params: dict[str, object] = {
        "id": uuid4(),
        "owner_id": uuid4(),
        "template_id": uuid4(),
        "template_version": "16",
        "name": "Ma base Postgres",
        "status": DeploymentStatus.PENDING,
        "params": {"port": 5432},
        "host": None,
        "published_port": None,
    }
    params.update(overrides)
    return Deployment(**params)  # type: ignore[arg-type]


class TestDeploymentValide:
    def test_construction_nominale(self) -> None:
        deployment = _deployment()

        assert deployment.name == "Ma base Postgres"
        assert deployment.status is DeploymentStatus.PENDING
        assert deployment.params == {"port": 5432}
        assert deployment.host is None
        assert deployment.published_port is None

    def test_running_avec_host_et_port(self) -> None:
        deployment = _deployment(
            status=DeploymentStatus.RUNNING, host="10.0.0.5", published_port=32768
        )

        assert deployment.host == "10.0.0.5"
        assert deployment.published_port == 32768

    def test_params_vide_autorise(self) -> None:
        deployment = _deployment(params={})

        assert deployment.params == {}


class TestDeploymentGuards:
    def test_name_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _deployment(name="   ")

    def test_template_version_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _deployment(template_version="")

    @pytest.mark.parametrize("port", [0, -1, 70000])
    def test_published_port_hors_plage_leve_value_error(self, port: int) -> None:
        with pytest.raises(ValueError):
            _deployment(published_port=port)


class TestDeploymentHelpers:
    @pytest.mark.parametrize(
        ("statut", "actif"),
        [
            (DeploymentStatus.DESTROYED, True),
            (DeploymentStatus.DESTROYING, False),
            (DeploymentStatus.RUNNING, False),
            (DeploymentStatus.PENDING, False),
        ],
    )
    def test_is_terminal(self, statut: DeploymentStatus, actif: bool) -> None:
        assert _deployment(status=statut).is_terminal() is actif
