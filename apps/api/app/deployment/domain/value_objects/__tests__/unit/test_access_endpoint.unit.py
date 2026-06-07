"""Tests unitaires du value object AccessEndpoint (host + port publie)."""

import pytest

from app.deployment.domain.value_objects.access_endpoint import AccessEndpoint


class TestAccessEndpointValide:
    def test_construction_nominale(self) -> None:
        endpoint = AccessEndpoint(host="10.0.0.5", port=32768)

        assert endpoint.host == "10.0.0.5"
        assert endpoint.port == 32768

    def test_url_concatene_host_et_port(self) -> None:
        endpoint = AccessEndpoint(host="10.0.0.5", port=5432)

        assert endpoint.url == "10.0.0.5:5432"

    def test_est_immutable(self) -> None:
        endpoint = AccessEndpoint(host="10.0.0.5", port=5432)

        with pytest.raises(Exception):  # noqa: B017 (FrozenInstanceError)
            endpoint.port = 1234  # type: ignore[misc]


class TestAccessEndpointGuards:
    def test_host_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            AccessEndpoint(host="   ", port=5432)

    @pytest.mark.parametrize("port", [0, -1, 65536, 70000])
    def test_port_hors_plage_leve_value_error(self, port: int) -> None:
        with pytest.raises(ValueError):
            AccessEndpoint(host="10.0.0.5", port=port)
