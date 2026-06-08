"""Tests unitaires de l'adaptateur OpenAIProvider (httpx mocke, hors-ligne).

Aucun appel reseau reel : le client httpx est instrumente via `MockTransport`.
Verifie la traduction messages + ToolDefinition vers le format OpenAI
(chat/completions, functions), le parsing d'une reponse texte et d'un tool call,
et l'agregation du streaming SSE en `LLMChunk`.
"""

import json
from collections.abc import AsyncIterator

import httpx

from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.value_objects.chat_message import ChatMessage
from app.chat.domain.value_objects.tool_definition import ToolDefinition
from app.chat.infrastructure.llm.openai_provider import OpenAIProvider

_MESSAGES = [ChatMessage(role=MessageRole.USER, content="Bonjour")]
_TOOLS = [ToolDefinition(name="list_catalog", description="Liste", params_schema={})]


def _provider(handler: httpx.MockTransport) -> OpenAIProvider:
    return OpenAIProvider(
        api_key="sk-test",
        model="gpt-4o-mini",
        base_url="https://api.openai.test/v1",
        transport=handler,
    )


class TestComplete:
    async def test_renvoie_un_chunk_texte(self) -> None:
        captured: dict[str, object] = {}

        def handle(request: httpx.Request) -> httpx.Response:
            captured["body"] = json.loads(request.content)
            captured["auth"] = request.headers.get("Authorization")
            return httpx.Response(
                200,
                json={"choices": [{"message": {"content": "Salut !", "tool_calls": None}}]},
            )

        provider = _provider(httpx.MockTransport(handle))

        chunk = await provider.complete(_MESSAGES, _TOOLS)

        assert chunk.delta == "Salut !"
        assert chunk.tool_call is None
        body = captured["body"]
        assert body["model"] == "gpt-4o-mini"  # type: ignore[index]
        assert body["messages"][0]["role"] == "user"  # type: ignore[index]
        assert body["tools"][0]["function"]["name"] == "list_catalog"  # type: ignore[index]
        assert captured["auth"] == "Bearer sk-test"

    async def test_parse_un_tool_call(self) -> None:
        def handle(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "choices": [
                        {
                            "message": {
                                "content": None,
                                "tool_calls": [
                                    {
                                        "function": {
                                            "name": "deploy_template",
                                            "arguments": json.dumps(
                                                {"template_id": "abc", "name": "db"}
                                            ),
                                        }
                                    }
                                ],
                            }
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
            for delta in ["Bon", "jour"]:
                payload = {"choices": [{"delta": {"content": delta}}]}
                yield f"data: {json.dumps(payload)}\n\n".encode()
            yield b"data: [DONE]\n\n"

        def handle(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=stream_body())

        provider = _provider(httpx.MockTransport(handle))

        deltas = [chunk.delta async for chunk in provider.stream(_MESSAGES, _TOOLS)]

        assert "".join(d for d in deltas if d) == "Bonjour"

    async def test_streame_un_tool_call(self) -> None:
        async def stream_body() -> AsyncIterator[bytes]:
            frames = [
                {
                    "choices": [
                        {
                            "delta": {
                                "tool_calls": [
                                    {"function": {"name": "stop_deployment", "arguments": ""}}
                                ]
                            }
                        }
                    ]
                },
                {
                    "choices": [
                        {
                            "delta": {
                                "tool_calls": [
                                    {"function": {"arguments": '{"deployment_id": "d1"}'}}
                                ]
                            }
                        }
                    ]
                },
            ]
            for frame in frames:
                yield f"data: {json.dumps(frame)}\n\n".encode()
            yield b"data: [DONE]\n\n"

        def handle(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=stream_body())

        provider = _provider(httpx.MockTransport(handle))

        chunks = [chunk async for chunk in provider.stream(_MESSAGES, _TOOLS)]

        tool_chunks = [c for c in chunks if c.is_tool_call()]
        assert len(tool_chunks) == 1
        assert tool_chunks[0].tool_call is not None
        assert tool_chunks[0].tool_call.name == "stop_deployment"
        assert tool_chunks[0].tool_call.args == {"deployment_id": "d1"}
