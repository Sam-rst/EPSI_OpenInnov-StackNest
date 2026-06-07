"""Tests unitaires de l'enum EngineKind (moteur de provisioning d'un template)."""

from enum import StrEnum

from app.catalog.domain.enums.engine_kind import EngineKind


class TestEngineKind:
    def test_est_un_str_enum(self) -> None:
        assert issubclass(EngineKind, StrEnum)

    def test_valeurs_attendues(self) -> None:
        assert {member.value for member in EngineKind} == {"docker", "terraform"}

    def test_docker_vaut_docker(self) -> None:
        assert EngineKind.DOCKER.value == "docker"

    def test_terraform_vaut_terraform(self) -> None:
        assert EngineKind.TERRAFORM.value == "terraform"
