"""Tests unitaires du FakeLLMProvider (double deterministe, aucun appel reseau)."""

from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.value_objects.chat_message import ChatMessage
from app.chat.domain.value_objects.tool_call import ToolCall
from app.chat.infrastructure.llm.fake_llm_provider import FakeLLMProvider


def _messages() -> list[ChatMessage]:
    return [ChatMessage(role=MessageRole.USER, content="Deploie un postgres")]


class TestFakeLLMProviderTexte:
    async def test_complete_renvoie_un_chunk_texte(self) -> None:
        provider = FakeLLMProvider(text="Voici ma reponse.")

        chunk = await provider.complete(_messages(), tools=[])

        assert chunk.is_tool_call() is False
        assert chunk.delta == "Voici ma reponse."

    async def test_stream_decoupe_la_reponse_en_chunks(self) -> None:
        provider = FakeLLMProvider(text="un deux trois")

        deltas = [chunk.delta async for chunk in provider.stream(_messages(), tools=[])]

        # Recompose le texte complet a partir des fragments (streaming).
        assert "".join(d for d in deltas if d is not None) == "un deux trois"
        assert len(deltas) >= 2

    async def test_stream_chunks_personnalises(self) -> None:
        provider = FakeLLMProvider(chunks=["Bon", "jour"])

        deltas = [chunk.delta async for chunk in provider.stream(_messages(), tools=[])]

        assert deltas == ["Bon", "jour"]


class TestFakeLLMProviderToolCall:
    def _provider(self) -> FakeLLMProvider:
        return FakeLLMProvider(
            tool_call=ToolCall(name="deploy_template", args={"template_id": "abc"})
        )

    async def test_complete_renvoie_un_chunk_appel_outil(self) -> None:
        chunk = await self._provider().complete(_messages(), tools=[])

        assert chunk.is_tool_call() is True
        assert chunk.tool_call is not None
        assert chunk.tool_call.name == "deploy_template"
        assert chunk.tool_call.args == {"template_id": "abc"}

    async def test_stream_emet_un_seul_chunk_appel_outil(self) -> None:
        chunks = [chunk async for chunk in self._provider().stream(_messages(), tools=[])]

        assert len(chunks) == 1
        assert chunks[0].is_tool_call() is True


class TestFakeLLMProviderObservabilite:
    async def test_enregistre_les_appels_recus(self) -> None:
        provider = FakeLLMProvider(text="ok")
        messages = _messages()

        await provider.complete(messages, tools=[])

        assert provider.calls == [list(messages)]
