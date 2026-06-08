"""Adaptateur LLMProvider pour l'API OpenAI (chat/completions + functions).

Traduit l'historique agnostique (`ChatMessage`) et les `ToolDefinition` vers le
format OpenAI, puis parse la reponse (texte ou tool call) en `LLMChunk`. Utilise
`httpx` directement (pas de SDK fournisseur) : le `transport` est injectable pour
instrumenter les tests hors-ligne (aucun appel reseau reel en test). La cle d'API
n'est requise qu'a l'appel reseau effectif, jamais a la construction (fabrique
tolerante au boot).
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
from app.chat.infrastructure.llm.sse_lines import iter_sse_data

_DEFAULT_BASE_URL = "https://api.openai.com/v1"
_DONE_SENTINEL = "[DONE]"


class OpenAIProvider(LLMProvider):
    """Implementation du port `LLMProvider` adossee a l'API OpenAI."""

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        base_url: str = "",
        timeout: float = 60.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._base_url = (base_url or _DEFAULT_BASE_URL).rstrip("/")
        self._timeout = timeout
        self._transport = transport

    async def complete(
        self, messages: Sequence[ChatMessage], tools: Sequence[ToolDefinition]
    ) -> LLMChunk:
        payload = self._build_payload(messages, tools, stream=False)
        async with self._client() as client:
            response = await client.post("/chat/completions", json=payload, headers=self._headers())
            response.raise_for_status()
            message = response.json()["choices"][0]["message"]
        return self._parse_message(message)

    async def stream(
        self, messages: Sequence[ChatMessage], tools: Sequence[ToolDefinition]
    ) -> AsyncIterator[LLMChunk]:
        payload = self._build_payload(messages, tools, stream=True)
        tool_name: str | None = None
        tool_args = ""
        async with (
            self._client() as client,
            client.stream(
                "POST", "/chat/completions", json=payload, headers=self._headers()
            ) as response,
        ):
            response.raise_for_status()
            async for data in iter_sse_data(response.aiter_lines()):
                if data == _DONE_SENTINEL:
                    break
                delta = json.loads(data)["choices"][0].get("delta", {})
                if delta.get("content"):
                    yield LLMChunk.of_text(delta["content"])
                name, args = self._extract_tool_delta(delta)
                tool_name = name or tool_name
                tool_args += args
        if tool_name is not None:
            yield LLMChunk.of_tool_call(ToolCall(name=tool_name, args=self._loads(tool_args)))

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=self._base_url, timeout=self._timeout, transport=self._transport
        )

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"}

    def _build_payload(
        self, messages: Sequence[ChatMessage], tools: Sequence[ToolDefinition], *, stream: bool
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": [{"role": m.role.value, "content": m.content} for m in messages],
            "stream": stream,
        }
        if tools:
            payload["tools"] = [self._to_openai_tool(tool) for tool in tools]
        return payload

    @staticmethod
    def _to_openai_tool(tool: ToolDefinition) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.params_schema or {"type": "object", "properties": {}},
            },
        }

    def _parse_message(self, message: dict[str, Any]) -> LLMChunk:
        tool_calls = message.get("tool_calls")
        if tool_calls:
            function = tool_calls[0]["function"]
            return LLMChunk.of_tool_call(
                ToolCall(name=function["name"], args=self._loads(function.get("arguments", "")))
            )
        return LLMChunk.of_text(message.get("content") or "")

    @staticmethod
    def _extract_tool_delta(delta: dict[str, Any]) -> tuple[str | None, str]:
        tool_calls = delta.get("tool_calls")
        if not tool_calls:
            return None, ""
        function = tool_calls[0].get("function", {})
        return function.get("name"), function.get("arguments", "") or ""

    @staticmethod
    def _loads(raw: str) -> dict[str, Any]:
        if not raw.strip():
            return {}
        parsed: dict[str, Any] = json.loads(raw)
        return parsed
