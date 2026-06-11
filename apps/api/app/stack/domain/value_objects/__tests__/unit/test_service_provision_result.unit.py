"""Tests unitaires du value object ServiceProvisionResult (guard clauses)."""

import pytest

from app.stack.domain.value_objects.service_provision_result import ServiceProvisionResult


class TestServiceProvisionResult:
    def test_construit_un_resultat_valide_avec_port(self) -> None:
        result = ServiceProvisionResult(
            alias="db", host="localhost", container_ref="stack_abc-db-1", published_port=32768
        )

        assert result.alias == "db"
        assert result.published_port == 32768

    def test_port_optionnel_pour_un_service_sans_port_interne(self) -> None:
        result = ServiceProvisionResult(
            alias="worker", host="localhost", container_ref="stack_abc-worker-1"
        )

        assert result.published_port is None

    def test_rejette_un_alias_vide(self) -> None:
        with pytest.raises(ValueError, match="alias"):
            ServiceProvisionResult(alias=" ", host="localhost", container_ref="ref")

    def test_rejette_une_ref_de_conteneur_vide(self) -> None:
        with pytest.raises(ValueError, match="container_ref"):
            ServiceProvisionResult(alias="db", host="localhost", container_ref="  ")

    def test_rejette_un_port_hors_plage(self) -> None:
        with pytest.raises(ValueError, match="published_port"):
            ServiceProvisionResult(
                alias="db", host="localhost", container_ref="ref", published_port=70000
            )
