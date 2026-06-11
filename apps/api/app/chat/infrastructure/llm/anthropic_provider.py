"""Adaptateur LLMProvider pour l'API Anthropic (Messages, blocs de contenu).

Traduit messages + `ToolDefinition` vers le format Anthropic (`/v1/messages`,
entetes `x-api-key` + `anthropic-version`, tools avec `input_schema`) et parse la
reponse — blocs `text` / `tool_use` — en `LLMChunk`. Le streaming reconstitue
les arguments d'un `tool_use` a partir des deltas `input_json_delta`. `httpx`
direct, `transport` injectable pour les tests hors-ligne. Cle requise seulement a
l'appel reseau (fabrique tolerante au boot).
"""

import json
from collections.abc import AsyncIterator, Sequence
from typing import Any

import httpx

from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.interfaces.llm_provider import LLMProvider
from app.chat.domain.value_objects.chat_message import ChatMessage
from app.chat.domain.value_objects.llm_chunk import LLMChunk
from app.chat.domain.value_objects.tool_call import ToolCall
from app.chat.domain.value_objects.tool_definition import ToolDefinition
from app.chat.infrastructure.llm.sse_lines import iter_sse_data

_DEFAULT_BASE_URL = "https://api.anthropic.com"
_API_VERSION = "2023-06-01"
_DEFAULT_MAX_TOKENS = 1024


class AnthropicProvider(LLMProvider):
    """Implementation du port `LLMProvider` adossee a l'API Anthropic Messages."""

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        base_url: str = "",
        timeout: float = 60.0,
        max_tokens: int = _DEFAULT_MAX_TOKENS,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._base_url = (base_url or _DEFAULT_BASE_URL).rstrip("/")
        self._timeout = timeout
        self._max_tokens = max_tokens
        self._transport = transport

    async def complete(
        self, messages: Sequence[ChatMessage], tools: Sequence[ToolDefinition]
    ) -> LLMChunk:
        payload = self._build_payload(messages, tools, stream=False)
        async with self._client() as client:
            response = await client.post("/v1/messages", json=payload, headers=self._headers())
            response.raise_for_status()
            blocks = response.json()["content"]
        return self._parse_blocks(blocks)

    async def stream(
        self, messages: Sequence[ChatMessage], tools: Sequence[ToolDefinition]
    ) -> AsyncIterator[LLMChunk]:
        payload = self._build_payload(messages, tools, stream=True)
        # Args d'outil accumules PAR INDEX de bloc : un `tool_use` parallele ne doit
        # jamais voir ses fragments concatenes avec ceux d'un autre (sinon json.loads
        # leve « Extra data »). On retient le 1er tool_use (un par passe cote moteur).
        tool_blocks: dict[int, dict[str, str]] = {}
        async with (
            self._client() as client,
            client.stream(
                "POST", "/v1/messages", json=payload, headers=self._headers()
            ) as response,
        ):
            response.raise_for_status()
            async for data in iter_sse_data(response.aiter_lines()):
                text = self._consume_stream_frame(json.loads(data), tool_blocks)
                if text:
                    yield LLMChunk.of_text(text)
        if tool_blocks:
            first = tool_blocks[min(tool_blocks)]
            yield LLMChunk.of_tool_call(
                ToolCall(name=first["name"], args=self._loads(first["args"]))
            )

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=self._base_url, timeout=self._timeout, transport=self._transport
        )

    def _headers(self) -> dict[str, str]:
        return {
            "x-api-key": self._api_key,
            "anthropic-version": _API_VERSION,
            "Content-Type": "application/json",
        }

    def _build_payload(
        self, messages: Sequence[ChatMessage], tools: Sequence[ToolDefinition], *, stream: bool
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self._model,
            "max_tokens": self._max_tokens,
            "messages": self._anthropic_messages(messages),
            "stream": stream,
        }
        if tools:
            payload["tools"] = [self._to_anthropic_tool(tool) for tool in tools]
            # Un seul outil a la fois : notre moteur traite une proposition par passe.
            # `disable_parallel_tool_use` evite que Claude emette plusieurs `tool_use`
            # en parallele (qu'on devrait sinon ignorer) — economie de tokens + simplicite.
            payload["tool_choice"] = {"type": "auto", "disable_parallel_tool_use": True}
        return payload

    @staticmethod
    def _anthropic_messages(messages: Sequence[ChatMessage]) -> list[dict[str, str]]:
        """Traduit l'historique vers le format Anthropic (roles + alternance stricte).

        Anthropic n'accepte que les roles `user` / `assistant`, sans deux messages
        consecutifs de meme role. On mappe donc `tool` -> `user` (les resultats
        d'outils sont fournis comme contexte utilisateur), puis on **fusionne** les
        messages consecutifs de meme role en concatenant leur contenu. Le prompt
        systeme, injecte en `user` en tete par le use case, fusionne ainsi
        naturellement avec le premier message utilisateur.
        """
        merged: list[dict[str, str]] = []
        for message in messages:
            role = "assistant" if message.role is MessageRole.ASSISTANT else "user"
            if merged and merged[-1]["role"] == role:
                merged[-1]["content"] = f"{merged[-1]['content']}\n\n{message.content}"
            else:
                merged.append({"role": role, "content": message.content})
        return merged

    @staticmethod
    def _to_anthropic_tool(tool: ToolDefinition) -> dict[str, Any]:
        return {
            "name": tool.name,
            "description": tool.description,
            "input_schema": tool.params_schema or {"type": "object", "properties": {}},
        }

    def _parse_blocks(self, blocks: list[dict[str, Any]]) -> LLMChunk:
        for block in blocks:
            if block.get("type") == "tool_use":
                return LLMChunk.of_tool_call(
                    ToolCall(name=block["name"], args=dict(block.get("input", {})))
                )
        text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text")
        return LLMChunk.of_text(text)

    @staticmethod
    def _consume_stream_frame(frame: dict[str, Any], tool_blocks: dict[int, dict[str, str]]) -> str:
        """Consomme une trame SSE : route les args d'outil par index, renvoie le texte.

        Chaque `tool_use` a son propre index de bloc ; ses fragments
        `input_json_delta` sont accumules SEPAREMENT dans `tool_blocks[index]`, jamais
        concatenes avec un autre bloc (ce qui evitait le « Extra data » de json.loads
        sur des tool_use paralleles). Renvoie le fragment de texte eventuel.
        """
        frame_type = frame.get("type")
        index = frame.get("index", 0)
        if frame_type == "content_block_start":
            block = frame.get("content_block", {})
            if block.get("type") == "tool_use":
                tool_blocks[index] = {"name": block.get("name", ""), "args": ""}
            return ""
        if frame_type == "content_block_delta":
            delta = frame.get("delta", {})
            if delta.get("type") == "text_delta":
                return str(delta.get("text", ""))
            if delta.get("type") == "input_json_delta" and index in tool_blocks:
                tool_blocks[index]["args"] += delta.get("partial_json", "")
        return ""

    @staticmethod
    def _loads(raw: str) -> dict[str, Any]:
        if not raw.strip():
            return {}
        parsed: dict[str, Any] = json.loads(raw)
        return parsed
