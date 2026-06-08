"""Tests unitaires de l'adaptateur OllamaProvider (httpx mocke, hors-ligne).

Ollama expose `/api/chat` (tool-calling natif) et streame en NDJSON (un objet
JSON par ligne, pas du SSE). Verifie la traduction du format, le parsing texte /
tool call, et l'agregation du flux NDJSON. Aucun appel reseau reel.
"""

import json
from collections.abc import AsyncIterator

import httpx

from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.value_objects.chat_message import ChatMessage
from app.chat.domain.value_objects.tool_definition import ToolDefinition
from app.chat.infrastructure.llm.ollama_provider import OllamaProvider

_MESSAGES = [ChatMessage(role=MessageRole.USER, content="Bonjour")]
_TOOLS = [ToolDefinition(name="list_catalog", description="Liste", params_schema={})]


def _provider(handler: httpx.MockTransport) -> OllamaProvider:
    return OllamaProvider(model="llama3.1", base_url="http://ollama.test:11434", transport=handler)


class TestComplete:
    async def test_renvoie_un_chunk_texte(self) -> None:
        captured: dict[str, object] = {}

        def handle(request: httpx.Request) -> httpx.Response:
            captured["body"] = json.loads(request.content)
            return httpx.Response(
                200, json={"message": {"role": "assistant", "content": "Salut !"}}
            )

        provider = _provider(httpx.MockTransport(handle))

        chunk = await provider.complete(_MESSAGES, _TOOLS)

        assert chunk.delta == "Salut !"
        body = captured["body"]
        assert body["model"] == "llama3.1"  # type: ignore[index]
        assert body["tools"][0]["function"]["name"] == "list_catalog"  # type: ignore[index]

    async def test_parse_un_tool_call(self) -> None:
        def handle(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "message": {
                        "role": "assistant",
                        "content": "",
                        "tool_calls": [
                            {
                                "function": {
                                    "name": "deploy_template",
                                    "arguments": {"template_id": "abc", "name": "db"},
                                }
                            }
                        ],
                    }
                },
            )

        provider = _provider(httpx.MockTransport(handle))

        chunk = await provider.complete(_MESSAGES, _TOOLS)

        assert chunk.is_tool_call()
        assert chunk.tool_call is not None
        assert chunk.tool_call.name == "deploy_template"
        assert chunk.tool_call.args == {"template_id": "abc", "name": "db"}


class TestStream:
    async def test_streame_les_deltas_ndjson(self) -> None:
        async def stream_body() -> AsyncIterator[bytes]:
            for delta in ["Bon", "jour"]:
                yield (json.dumps({"message": {"content": delta}, "done": False}) + "\n").encode()
            yield (json.dumps({"message": {"content": ""}, "done": True}) + "\n").encode()

        def handle(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=stream_body())

        provider = _provider(httpx.MockTransport(handle))

        deltas = [chunk.delta async for chunk in provider.stream(_MESSAGES, _TOOLS)]

        assert "".join(d for d in deltas if d) == "Bonjour"

    async def test_streame_un_tool_call(self) -> None:
        async def stream_body() -> AsyncIterator[bytes]:
            frame = {
                "message": {
                    "content": "",
                    "tool_calls": [
                        {
                            "function": {
                                "name": "stop_deployment",
                                "arguments": {"deployment_id": "d1"},
                            }
                        }
                    ],
                },
                "done": True,
            }
            yield (json.dumps(frame) + "\n").encode()

        def handle(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=stream_body())

        provider = _provider(httpx.MockTransport(handle))

        chunks = [chunk async for chunk in provider.stream(_MESSAGES, _TOOLS)]

        tool_chunks = [c for c in chunks if c.is_tool_call()]
        assert len(tool_chunks) == 1
        assert tool_chunks[0].tool_call is not None
        assert tool_chunks[0].tool_call.name == "stop_deployment"
        assert tool_chunks[0].tool_call.args == {"deployment_id": "d1"}
