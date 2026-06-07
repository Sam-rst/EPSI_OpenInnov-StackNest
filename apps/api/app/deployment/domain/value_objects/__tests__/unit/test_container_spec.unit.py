"""Tests unitaires du value object ContainerSpec (specification d'un conteneur)."""

import pytest

from app.deployment.domain.value_objects.container_spec import ContainerSpec


def _spec(**overrides: object) -> ContainerSpec:
    params: dict[str, object] = {
        "image": "postgres:16",
        "env": {"POSTGRES_PASSWORD": "s3cr3t"},
        "command": None,
        "internal_port": 5432,
        "cpu_limit": 1.0,
        "mem_limit": "512m",
        "labels": {"stacknest.deployment_id": "abc"},
    }
    params.update(overrides)
    return ContainerSpec(**params)  # type: ignore[arg-type]


class TestContainerSpecValide:
    def test_construction_nominale(self) -> None:
        spec = _spec()

        assert spec.image == "postgres:16"
        assert spec.env == {"POSTGRES_PASSWORD": "s3cr3t"}
        assert spec.internal_port == 5432
        assert spec.cpu_limit == 1.0
        assert spec.mem_limit == "512m"
        assert spec.labels == {"stacknest.deployment_id": "abc"}

    def test_command_et_internal_port_optionnels(self) -> None:
        spec = _spec(command=["redis-server", "--requirepass", "x"], internal_port=None)

        assert spec.command == ["redis-server", "--requirepass", "x"]
        assert spec.internal_port is None

    def test_env_vide_autorise(self) -> None:
        spec = _spec(env={})

        assert spec.env == {}

    def test_est_immutable(self) -> None:
        spec = _spec()

        with pytest.raises(Exception):  # noqa: B017 (FrozenInstanceError)
            spec.image = "autre"  # type: ignore[misc]


class TestContainerSpecGuards:
    def test_image_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _spec(image="   ")

    def test_image_sans_tag_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _spec(image="postgres")

    @pytest.mark.parametrize("port", [0, -1, 70000])
    def test_internal_port_hors_plage_leve_value_error(self, port: int) -> None:
        with pytest.raises(ValueError):
            _spec(internal_port=port)

    @pytest.mark.parametrize("cpu", [0.0, -0.5])
    def test_cpu_limit_non_positif_leve_value_error(self, cpu: float) -> None:
        with pytest.raises(ValueError):
            _spec(cpu_limit=cpu)

    def test_mem_limit_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _spec(mem_limit="  ")

    def test_command_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _spec(command=[])
