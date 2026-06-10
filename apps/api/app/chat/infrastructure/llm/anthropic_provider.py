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
        tool_name: str | None = None
        tool_args = ""
        async with (
            self._client() as client,
            client.stream(
                "POST", "/v1/messages", json=payload, headers=self._headers()
            ) as response,
        ):
            response.raise_for_status()
            async for data in iter_sse_data(response.aiter_lines()):
                frame = json.loads(data)
                name, text, args = self._read_frame(frame)
                tool_name = name or tool_name
                tool_args += args
                if text:
                    yield LLMChunk.of_text(text)
        if tool_name is not None:
            yield LLMChunk.of_tool_call(ToolCall(name=tool_name, args=self._loads(tool_args)))

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
    def _read_frame(frame: dict[str, Any]) -> tuple[str | None, str, str]:
        frame_type = frame.get("type")
        if frame_type == "content_block_start":
            block = frame.get("content_block", {})
            return (block.get("name") if block.get("type") == "tool_use" else None), "", ""
        if frame_type == "content_block_delta":
            delta = frame.get("delta", {})
            if delta.get("type") == "text_delta":
                return None, delta.get("text", ""), ""
            if delta.get("type") == "input_json_delta":
                return None, "", delta.get("partial_json", "")
        return None, "", ""

    @staticmethod
    def _loads(raw: str) -> dict[str, Any]:
        if not raw.strip():
            return {}
        parsed: dict[str, Any] = json.loads(raw)
        return parsed
