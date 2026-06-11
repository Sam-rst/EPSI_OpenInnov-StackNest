"""Tests unitaires du value object TemplateParamSpec (descripteur de parametre)."""

from app.catalog.domain.enums.param_type import ParamType
from app.deployment.domain.value_objects.template_param_spec import TemplateParamSpec


class TestTemplateParamSpec:
    def test_expose_les_champs_du_descripteur(self) -> None:
        spec = TemplateParamSpec(key="db_name", type=ParamType.STRING, required=True, options=None)

        assert spec.key == "db_name"
        assert spec.type is ParamType.STRING
        assert spec.required is True
        assert spec.options is None

    def test_env_var_optionnel_defaut_none(self) -> None:
        spec = TemplateParamSpec(key="db_name", type=ParamType.STRING, required=True, options=None)

        assert spec.env_var is None

    def test_env_var_renseigne(self) -> None:
        spec = TemplateParamSpec(
            key="db_name",
            type=ParamType.STRING,
            required=True,
            options=None,
            env_var="POSTGRES_DB",
        )

        assert spec.env_var == "POSTGRES_DB"

    def test_default_value_optionnel_defaut_none(self) -> None:
        spec = TemplateParamSpec(key="db_name", type=ParamType.STRING, required=True, options=None)

        assert spec.default_value is None

    def test_default_value_renseigne(self) -> None:
        spec = TemplateParamSpec(
            key="username",
            type=ParamType.STRING,
            required=True,
            options=None,
            default_value="root",
        )

        assert spec.default_value == "root"

    def test_is_secret_vrai_pour_un_param_secret(self) -> None:
        spec = TemplateParamSpec(key="api_key", type=ParamType.SECRET, required=True, options=None)

        assert spec.is_secret() is True

    def test_is_secret_faux_pour_les_autres_types(self) -> None:
        for param_type in (ParamType.STRING, ParamType.INT, ParamType.BOOL, ParamType.SELECT):
            spec = TemplateParamSpec(
                key="p", type=param_type, required=False, options={"choices": ["a"]}
            )
            assert spec.is_secret() is False

    def test_allowed_values_d_un_select(self) -> None:
        spec = TemplateParamSpec(
            key="size",
            type=ParamType.SELECT,
            required=True,
            options={"choices": ["small", "large"]},
        )

        assert spec.allowed_values() == ["small", "large"]

    def test_allowed_values_vide_hors_select(self) -> None:
        spec = TemplateParamSpec(key="db_name", type=ParamType.STRING, required=True, options=None)

        assert spec.allowed_values() == []
