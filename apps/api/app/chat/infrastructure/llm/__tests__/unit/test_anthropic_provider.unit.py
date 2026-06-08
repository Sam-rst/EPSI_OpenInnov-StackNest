"""Tests unitaires de l'adaptateur AnthropicProvider (httpx mocke, hors-ligne).

Anthropic expose `/v1/messages` (entetes x-api-key + anthropic-version, tools
avec input_schema, blocs de contenu text / tool_use) et streame en SSE typé.
Verifie la traduction du format, le parsing des blocs de contenu, et
l'agregation du flux SSE. Aucun appel reseau reel.
"""

import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.value_objects.chat_message import ChatMessage
from app.chat.domain.value_objects.tool_definition import ToolDefinition
from app.chat.infrastructure.llm.anthropic_provider import AnthropicProvider

_MESSAGES = [ChatMessage(role=MessageRole.USER, content="Bonjour")]
_TOOLS = [ToolDefinition(name="list_catalog", description="Liste", params_schema={})]


def _provider(handler: httpx.MockTransport) -> AnthropicProvider:
    return AnthropicProvider(
        api_key="sk-ant",
        model="claude-3-5",
        base_url="https://api.anthropic.test",
        transport=handler,
    )


class TestComplete:
    async def test_renvoie_un_chunk_texte(self) -> None:
        captured: dict[str, object] = {}

        def handle(request: httpx.Request) -> httpx.Response:
            captured["body"] = json.loads(request.content)
            captured["api_key"] = request.headers.get("x-api-key")
            captured["version"] = request.headers.get("anthropic-version")
            return httpx.Response(200, json={"content": [{"type": "text", "text": "Salut !"}]})

        provider = _provider(httpx.MockTransport(handle))

        chunk = await provider.complete(_MESSAGES, _TOOLS)

        assert chunk.delta == "Salut !"
        body = captured["body"]
        assert body["model"] == "claude-3-5"  # type: ignore[index]
        assert body["tools"][0]["name"] == "list_catalog"  # type: ignore[index]
        assert "input_schema" in body["tools"][0]  # type: ignore[index]
        assert captured["api_key"] == "sk-ant"
        assert captured["version"]

    async def test_parse_un_tool_use(self) -> None:
        def handle(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "content": [
                        {
                            "type": "tool_use",
                            "name": "deploy_template",
                            "input": {"template_id": "abc", "name": "db"},
                        }
                    ]
                },
            )

        provider = _provider(httpx.MockTransport(handle))

        chunk = await provider.complete(_MESSAGES, _TOOLS)

        assert chunk.is_tool_call()
        assert chunk.tool_call is not None
        assert chunk.tool_call.name == "deploy_template"
        assert chunk.tool_call.args == {"template_id": "abc", "name": "db"}


class TestStream:
    async def test_streame_les_deltas_de_texte(self) -> None:
        async def stream_body() -> AsyncIterator[bytes]:
            frames: list[dict[str, Any]] = [
                {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "Bon"}},
                {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "jour"}},
                {"type": "message_stop"},
            ]
            for frame in frames:
                yield f"event: {frame['type']}\ndata: {json.dumps(frame)}\n\n".encode()

        def handle(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=stream_body())

        provider = _provider(httpx.MockTransport(handle))

        deltas = [chunk.delta async for chunk in provider.stream(_MESSAGES, _TOOLS)]

        assert "".join(d for d in deltas if d) == "Bonjour"

    async def test_streame_un_tool_use(self) -> None:
        async def stream_body() -> AsyncIterator[bytes]:
            frames: list[dict[str, Any]] = [
                {
                    "type": "content_block_start",
                    "content_block": {"type": "tool_use", "name": "stop_deployment"},
                },
                {
                    "type": "content_block_delta",
                    "delta": {"type": "input_json_delta", "partial_json": '{"deployment_id":'},
                },
                {
                    "type": "content_block_delta",
                    "delta": {"type": "input_json_delta", "partial_json": ' "d1"}'},
                },
                {"type": "message_stop"},
            ]
            for frame in frames:
                yield f"event: {frame['type']}\ndata: {json.dumps(frame)}\n\n".encode()

        def handle(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=stream_body())

        provider = _provider(httpx.MockTransport(handle))

        chunks = [chunk async for chunk in provider.stream(_MESSAGES, _TOOLS)]

        tool_chunks = [c for c in chunks if c.is_tool_call()]
        assert len(tool_chunks) == 1
        assert tool_chunks[0].tool_call is not None
        assert tool_chunks[0].tool_call.name == "stop_deployment"
        assert tool_chunks[0].tool_call.args == {"deployment_id": "d1"}
