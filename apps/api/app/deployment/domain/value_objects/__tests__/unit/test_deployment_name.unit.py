"""Tests unitaires du value object DeploymentName (format type label DNS)."""

import pytest

from app.deployment.domain.exceptions.invalid_deployment_name import (
    InvalidDeploymentNameException,
)
from app.deployment.domain.value_objects.deployment_name import DeploymentName


class TestDeploymentName:
    def test_accepte_un_label_dns_valide(self) -> None:
        name = DeploymentName("ma-base")

        assert name.value == "ma-base"
        assert str(name) == "ma-base"

    def test_accepte_un_label_d_un_seul_caractere(self) -> None:
        assert DeploymentName("a").value == "a"

    def test_accepte_chiffres_et_tirets_internes(self) -> None:
        assert DeploymentName("pg-16-prod").value == "pg-16-prod"

    def test_egalite_par_valeur(self) -> None:
        assert DeploymentName("ma-base") == DeploymentName("ma-base")

    def test_rejette_les_majuscules(self) -> None:
        with pytest.raises(InvalidDeploymentNameException):
            DeploymentName("Ma Base!")

    def test_rejette_les_espaces(self) -> None:
        with pytest.raises(InvalidDeploymentNameException):
            DeploymentName("ma base")

    def test_rejette_les_caracteres_speciaux(self) -> None:
        with pytest.raises(InvalidDeploymentNameException):
            DeploymentName("ma_base!")

    def test_rejette_un_nom_vide(self) -> None:
        with pytest.raises(InvalidDeploymentNameException):
            DeploymentName("")

    def test_rejette_un_tiret_en_tete(self) -> None:
        with pytest.raises(InvalidDeploymentNameException):
            DeploymentName("-base")

    def test_rejette_un_tiret_en_fin(self) -> None:
        with pytest.raises(InvalidDeploymentNameException):
            DeploymentName("base-")

    def test_rejette_un_nom_trop_long(self) -> None:
        with pytest.raises(InvalidDeploymentNameException):
            DeploymentName("a" * 64)

    def test_accepte_la_longueur_maximale(self) -> None:
        assert DeploymentName("a" * 63).value == "a" * 63

    def test_message_d_erreur_en_francais(self) -> None:
        with pytest.raises(InvalidDeploymentNameException) as error:
            DeploymentName("Ma Base!")

        assert error.value.http_status == 422
        assert error.value.code == "INVALID_DEPLOYMENT_NAME"
        assert "minuscule" in error.value.message.lower()
