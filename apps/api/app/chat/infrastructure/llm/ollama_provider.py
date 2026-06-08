"""Adaptateur LLMProvider pour Ollama (LLM local, /api/chat, NDJSON).

Ollama expose le tool-calling natif via `/api/chat` et streame en NDJSON (un
objet JSON par ligne, pas du SSE). Traduit messages + `ToolDefinition` vers ce
format et parse texte / tool call en `LLMChunk`. Sans cle (LLM local) : c'est le
fournisseur par defaut. `httpx` direct, `transport` injectable pour les tests.
"""

import json
from collections.abc import AsyncIterator, Sequence
from typing import Any

import httpx

from app.chat.domain.interfaces.llm_provider import LLMProvider
from app.chat.domain.value_objects.chat_message import ChatMessage
from app.chat.domain.value_objects.llm_chunk import LLMChunk
from app.chat.domain.value_objects.tool_call import ToolCall
from app.chat.domain.value_objects.tool_definition import ToolDefinition

_DEFAULT_BASE_URL = "http://localhost:11434"


class OllamaProvider(LLMProvider):
    """Implementation du port `LLMProvider` adossee a un serveur Ollama local."""

    def __init__(
        self,
        *,
        model: str,
        base_url: str = "",
        timeout: float = 60.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._model = model
        self._base_url = (base_url or _DEFAULT_BASE_URL).rstrip("/")
        self._timeout = timeout
        self._transport = transport

    async def complete(
        self, messages: Sequence[ChatMessage], tools: Sequence[ToolDefinition]
    ) -> LLMChunk:
        payload = self._build_payload(messages, tools, stream=False)
        async with self._client() as client:
            response = await client.post("/api/chat", json=payload)
            response.raise_for_status()
            message = response.json()["message"]
        return self._parse_message(message)

    async def stream(
        self, messages: Sequence[ChatMessage], tools: Sequence[ToolDefinition]
    ) -> AsyncIterator[LLMChunk]:
        payload = self._build_payload(messages, tools, stream=True)
        async with (
            self._client() as client,
            client.stream("POST", "/api/chat", json=payload) as response,
        ):
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                message = json.loads(line).get("message", {})
                tool_call = self._extract_tool_call(message)
                if tool_call is not None:
                    yield LLMChunk.of_tool_call(tool_call)
                elif message.get("content"):
                    yield LLMChunk.of_text(message["content"])

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=self._base_url, timeout=self._timeout, transport=self._transport
        )

    def _build_payload(
        self, messages: Sequence[ChatMessage], tools: Sequence[ToolDefinition], *, stream: bool
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": [{"role": m.role.value, "content": m.content} for m in messages],
            "stream": stream,
        }
        if tools:
            payload["tools"] = [self._to_ollama_tool(tool) for tool in tools]
        return payload

    @staticmethod
    def _to_ollama_tool(tool: ToolDefinition) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.params_schema or {"type": "object", "properties": {}},
            },
        }

    @classmethod
    def _parse_message(cls, message: dict[str, Any]) -> LLMChunk:
        tool_call = cls._extract_tool_call(message)
        if tool_call is not None:
            return LLMChunk.of_tool_call(tool_call)
        return LLMChunk.of_text(message.get("content") or "")

    @staticmethod
    def _extract_tool_call(message: dict[str, Any]) -> ToolCall | None:
        tool_calls = message.get("tool_calls")
        if not tool_calls:
            return None
        function = tool_calls[0]["function"]
        arguments = function.get("arguments") or {}
        return ToolCall(name=function["name"], args=dict(arguments))
