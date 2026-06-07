"""Tests unitaires de l'entite TemplateParam (guards metier)."""

from uuid import uuid4

import pytest

from app.catalog.domain.entities.template_param import TemplateParam
from app.catalog.domain.enums.param_type import ParamType


def _param(**overrides: object) -> TemplateParam:
    params: dict[str, object] = {
        "id": uuid4(),
        "key": "db_name",
        "label": "Nom de la base",
        "type": ParamType.STRING,
        "required": True,
        "default_value": "app",
        "options": None,
        "order_index": 0,
    }
    params.update(overrides)
    return TemplateParam(**params)  # type: ignore[arg-type]


class TestTemplateParamValide:
    def test_construction_nominale(self) -> None:
        param = _param()

        assert param.key == "db_name"
        assert param.type is ParamType.STRING

    def test_select_avec_options(self) -> None:
        param = _param(
            type=ParamType.SELECT,
            options={"choices": ["small", "medium", "large"]},
            default_value="small",
        )

        assert param.options == {"choices": ["small", "medium", "large"]}


class TestTemplateParamGuards:
    def test_key_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _param(key="")

    def test_label_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _param(label="  ")

    def test_order_index_negatif_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _param(order_index=-1)

    def test_select_sans_options_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _param(type=ParamType.SELECT, options=None)
