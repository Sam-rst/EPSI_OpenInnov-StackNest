"""Tests unitaires du value object ToolDefinition (outil expose au LLM)."""

import pytest

from app.chat.domain.value_objects.tool_definition import ToolDefinition


def _definition(**overrides: object) -> ToolDefinition:
    params: dict[str, object] = {
        "name": "deploy_template",
        "description": "Provisionne une ressource a partir d'un template.",
        "params_schema": {
            "type": "object",
            "properties": {"template_id": {"type": "string"}},
            "required": ["template_id"],
        },
    }
    params.update(overrides)
    return ToolDefinition(**params)  # type: ignore[arg-type]


class TestToolDefinitionValide:
    def test_construction_nominale(self) -> None:
        definition = _definition()

        assert definition.name == "deploy_template"
        assert definition.description.startswith("Provisionne")
        assert definition.params_schema["type"] == "object"

    def test_schema_vide_autorise_outil_sans_argument(self) -> None:
        definition = _definition(params_schema={})

        assert definition.params_schema == {}

    def test_est_immutable(self) -> None:
        definition = _definition()

        with pytest.raises(Exception):  # noqa: B017 (FrozenInstanceError)
            definition.name = "autre"  # type: ignore[misc]


class TestToolDefinitionGuards:
    def test_nom_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _definition(name="   ")

    def test_description_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _definition(description="")
