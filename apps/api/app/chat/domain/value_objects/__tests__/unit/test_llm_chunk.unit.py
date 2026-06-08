"""Tests unitaires du value object LLMChunk (fragment de reponse streame)."""

import pytest

from app.chat.domain.value_objects.llm_chunk import LLMChunk
from app.chat.domain.value_objects.tool_call import ToolCall


class TestLLMChunkTexte:
    def test_fragment_texte(self) -> None:
        chunk = LLMChunk.of_text("Bonjour")

        assert chunk.delta == "Bonjour"
        assert chunk.tool_call is None
        assert chunk.is_tool_call() is False

    def test_fragment_texte_vide_autorise(self) -> None:
        # Certains fournisseurs emettent un dernier chunk vide (fin de stream).
        chunk = LLMChunk.of_text("")

        assert chunk.delta == ""
        assert chunk.is_tool_call() is False


class TestLLMChunkToolCall:
    def test_fragment_appel_outil(self) -> None:
        call = ToolCall(name="deploy_template", args={"template_id": "abc"})
        chunk = LLMChunk.of_tool_call(call)

        assert chunk.tool_call == call
        assert chunk.delta is None
        assert chunk.is_tool_call() is True


class TestLLMChunkGuards:
    def test_immutable(self) -> None:
        chunk = LLMChunk.of_text("x")

        with pytest.raises(Exception):  # noqa: B017 (FrozenInstanceError)
            chunk.delta = "y"  # type: ignore[misc]

    def test_les_deux_vides_leve_value_error(self) -> None:
        # Un chunk doit porter exactement un contenu : texte XOR appel d'outil.
        with pytest.raises(ValueError):
            LLMChunk(delta=None, tool_call=None)

    def test_les_deux_remplis_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            LLMChunk(delta="x", tool_call=ToolCall(name="t", args={}))
