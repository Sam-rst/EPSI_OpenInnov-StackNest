"""Adaptateur LLM factice et deterministe pour les tests (aucun appel reseau)."""

from collections.abc import AsyncIterator, Sequence

from app.chat.domain.interfaces.llm_provider import LLMProvider
from app.chat.domain.value_objects.chat_message import ChatMessage
from app.chat.domain.value_objects.llm_chunk import LLMChunk
from app.chat.domain.value_objects.tool_call import ToolCall
from app.chat.domain.value_objects.tool_definition import ToolDefinition


class FakeLLMProvider(LLMProvider):
    """Implementation du port `LLMProvider` scriptee pour les tests.

    Deterministe et hors-ligne : ne fait **aucun** appel reseau. Configure a la
    construction pour renvoyer soit une reponse texte, soit un appel d'outil :

    - `tool_call` fourni            -> emet un unique chunk d'appel d'outil.
    - `chunks` fournis              -> streame ces fragments texte tels quels.
    - `text` seul                   -> streame le texte decoupe par mots.

    Enregistre les `messages` recus dans `calls` pour permettre aux tests de
    verifier le contexte transmis (historique, derive du catalogue en vague 2).
    """

    def __init__(
        self,
        *,
        text: str = "",
        chunks: Sequence[str] | None = None,
        tool_call: ToolCall | None = None,
    ) -> None:
        self._tool_call = tool_call
        self._chunks = self._resolve_chunks(text, chunks)
        self.calls: list[list[ChatMessage]] = []

    @staticmethod
    def _resolve_chunks(text: str, chunks: Sequence[str] | None) -> list[str]:
        if chunks is not None:
            return list(chunks)
        if not text:
            return [""]
        # Decoupe par mots en conservant les espaces (recomposable a l'identique).
        return text.split(" ")[:1] + [f" {word}" for word in text.split(" ")[1:]]

    async def stream(
        self,
        messages: Sequence[ChatMessage],
        tools: Sequence[ToolDefinition],
    ) -> AsyncIterator[LLMChunk]:
        self.calls.append(list(messages))
        if self._tool_call is not None:
            yield LLMChunk.of_tool_call(self._tool_call)
            return
        for fragment in self._chunks:
            yield LLMChunk.of_text(fragment)

    async def complete(
        self,
        messages: Sequence[ChatMessage],
        tools: Sequence[ToolDefinition],
    ) -> LLMChunk:
        self.calls.append(list(messages))
        if self._tool_call is not None:
            return LLMChunk.of_tool_call(self._tool_call)
        return LLMChunk.of_text("".join(self._chunks))
