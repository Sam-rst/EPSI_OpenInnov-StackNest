"""Tests unitaires du value object ProvisionResult (retour du Provisioner.create)."""

import pytest

from app.deployment.domain.value_objects.provision_result import ProvisionResult


class TestProvisionResultValide:
    def test_construction_nominale(self) -> None:
        result = ProvisionResult(host="10.0.0.5", port=32768, container_ref="c0ffee")

        assert result.host == "10.0.0.5"
        assert result.port == 32768
        assert result.container_ref == "c0ffee"

    def test_est_immutable(self) -> None:
        result = ProvisionResult(host="10.0.0.5", port=32768, container_ref="c0ffee")

        with pytest.raises(Exception):  # noqa: B017 (FrozenInstanceError)
            result.port = 1  # type: ignore[misc]


class TestProvisionResultGuards:
    def test_container_ref_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            ProvisionResult(host="10.0.0.5", port=32768, container_ref="  ")

    def test_host_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            ProvisionResult(host="", port=32768, container_ref="c0ffee")

    @pytest.mark.parametrize("port", [0, -1, 70000])
    def test_port_hors_plage_leve_value_error(self, port: int) -> None:
        with pytest.raises(ValueError):
            ProvisionResult(host="10.0.0.5", port=port, container_ref="c0ffee")
