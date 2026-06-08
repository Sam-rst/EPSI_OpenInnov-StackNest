"""Tests unitaires du value object ToolCall (appel d'outil emis par le LLM)."""

import pytest

from app.chat.domain.value_objects.tool_call import ToolCall


class TestToolCallValide:
    def test_construction_nominale(self) -> None:
        call = ToolCall(name="deploy_template", args={"template_id": "abc", "version": "16"})

        assert call.name == "deploy_template"
        assert call.args == {"template_id": "abc", "version": "16"}

    def test_args_vides_autorises(self) -> None:
        call = ToolCall(name="list_my_deployments", args={})

        assert call.args == {}

    def test_est_immutable(self) -> None:
        call = ToolCall(name="stop_deployment", args={})

        with pytest.raises(Exception):  # noqa: B017 (FrozenInstanceError)
            call.name = "autre"  # type: ignore[misc]


class TestToolCallGuards:
    def test_nom_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            ToolCall(name="   ", args={})
