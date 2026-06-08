"""Tests unitaires du validateur de parametres de deploiement."""

import pytest

from app.catalog.domain.enums.param_type import ParamType
from app.deployment.domain.exceptions.invalid_deployment_params import (
    InvalidDeploymentParamsException,
)
from app.deployment.domain.services.deployment_params_validator import (
    DeploymentParamsValidator,
)
from app.deployment.domain.value_objects.template_param_spec import TemplateParamSpec


def _spec(
    key: str,
    *,
    type: ParamType = ParamType.STRING,
    required: bool = False,
    options: dict[str, object] | None = None,
) -> TemplateParamSpec:
    return TemplateParamSpec(key=key, type=type, required=required, options=options)


class TestRequiredParams:
    def test_param_requis_present_passe(self) -> None:
        specs = (_spec("db_name", required=True),)

        DeploymentParamsValidator(specs).validate({"db_name": "app"})

    def test_param_requis_manquant_leve(self) -> None:
        specs = (_spec("db_name", required=True),)

        with pytest.raises(InvalidDeploymentParamsException) as error:
            DeploymentParamsValidator(specs).validate({})

        assert "db_name" in error.value.message

    def test_param_requis_chaine_vide_leve(self) -> None:
        specs = (_spec("db_name", required=True),)

        with pytest.raises(InvalidDeploymentParamsException):
            DeploymentParamsValidator(specs).validate({"db_name": "   "})

    def test_param_requis_none_leve(self) -> None:
        specs = (_spec("db_name", required=True),)

        with pytest.raises(InvalidDeploymentParamsException):
            DeploymentParamsValidator(specs).validate({"db_name": None})

    def test_param_optionnel_absent_passe(self) -> None:
        specs = (_spec("comment", required=False),)

        DeploymentParamsValidator(specs).validate({})

    def test_secret_requis_manquant_leve(self) -> None:
        specs = (_spec("api_key", type=ParamType.SECRET, required=True),)

        with pytest.raises(InvalidDeploymentParamsException):
            DeploymentParamsValidator(specs).validate({})


class TestTypeConformity:
    def test_int_accepte_un_entier(self) -> None:
        specs = (_spec("port", type=ParamType.INT, required=True),)

        DeploymentParamsValidator(specs).validate({"port": 5432})

    def test_int_accepte_un_entier_textuel(self) -> None:
        specs = (_spec("port", type=ParamType.INT, required=True),)

        DeploymentParamsValidator(specs).validate({"port": "5432"})

    def test_int_accepte_un_entier_negatif_textuel(self) -> None:
        specs = (_spec("offset", type=ParamType.INT, required=True),)

        DeploymentParamsValidator(specs).validate({"offset": "-3"})

    def test_int_rejette_une_valeur_non_entiere(self) -> None:
        specs = (_spec("port", type=ParamType.INT, required=True),)

        with pytest.raises(InvalidDeploymentParamsException) as error:
            DeploymentParamsValidator(specs).validate({"port": "abc"})

        assert "port" in error.value.message

    def test_int_rejette_un_flottant(self) -> None:
        specs = (_spec("port", type=ParamType.INT, required=True),)

        with pytest.raises(InvalidDeploymentParamsException):
            DeploymentParamsValidator(specs).validate({"port": 5.5})

    def test_bool_accepte_un_booleen(self) -> None:
        specs = (_spec("tls", type=ParamType.BOOL, required=True),)

        DeploymentParamsValidator(specs).validate({"tls": True})

    def test_bool_rejette_une_valeur_non_booleenne(self) -> None:
        specs = (_spec("tls", type=ParamType.BOOL, required=True),)

        with pytest.raises(InvalidDeploymentParamsException):
            DeploymentParamsValidator(specs).validate({"tls": "peut-etre"})

    def test_select_accepte_une_valeur_de_la_liste(self) -> None:
        specs = (
            _spec(
                "size",
                type=ParamType.SELECT,
                required=True,
                options={"choices": ["small", "large"]},
            ),
        )

        DeploymentParamsValidator(specs).validate({"size": "small"})

    def test_select_rejette_une_valeur_hors_liste(self) -> None:
        specs = (
            _spec(
                "size",
                type=ParamType.SELECT,
                required=True,
                options={"choices": ["small", "large"]},
            ),
        )

        with pytest.raises(InvalidDeploymentParamsException) as error:
            DeploymentParamsValidator(specs).validate({"size": "huge"})

        assert "size" in error.value.message

    def test_optionnel_vide_ne_declenche_pas_le_controle_de_type(self) -> None:
        specs = (_spec("port", type=ParamType.INT, required=False),)

        DeploymentParamsValidator(specs).validate({"port": ""})


class TestUnknownParams:
    def test_param_inconnu_est_ignore(self) -> None:
        # Un param non declare par le template ne fait pas echouer la validation
        # (tolerance : le worker n'injecte que ce que le template attend).
        specs = (_spec("db_name", required=True),)

        DeploymentParamsValidator(specs).validate({"db_name": "app", "extra": "x"})

    def test_sans_descripteur_aucune_contrainte(self) -> None:
        DeploymentParamsValidator(()).validate({"foo": "bar"})
