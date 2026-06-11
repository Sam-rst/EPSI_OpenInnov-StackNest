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


class TestMessageMapping:
    """Anthropic n'accepte que les roles user/assistant, en alternance stricte.

    Notre flux porte des messages `tool` (resultats d'outils reinjectes) et un
    prompt systeme injecte en `user` en tete. L'adaptateur doit donc mapper
    `tool`->`user` et fusionner les messages consecutifs de meme role, sinon
    l'API renvoie une 400 des le 1er tour guide.
    """

    async def test_mappe_le_role_tool_vers_user(self) -> None:
        captured: dict[str, Any] = {}

        def handle(request: httpx.Request) -> httpx.Response:
            captured["body"] = json.loads(request.content)
            return httpx.Response(200, json={"content": [{"type": "text", "text": "ok"}]})

        provider = _provider(httpx.MockTransport(handle))
        messages = [
            ChatMessage(role=MessageRole.USER, content="Q"),
            ChatMessage(role=MessageRole.ASSISTANT, content="A"),
            ChatMessage(role=MessageRole.TOOL, content="[get_template] {...}"),
        ]

        await provider.complete(messages, [])

        roles = [m["role"] for m in captured["body"]["messages"]]
        assert "tool" not in roles
        assert set(roles) <= {"user", "assistant"}

    async def test_fusionne_les_messages_consecutifs_de_meme_role(self) -> None:
        captured: dict[str, Any] = {}

        def handle(request: httpx.Request) -> httpx.Response:
            captured["body"] = json.loads(request.content)
            return httpx.Response(200, json={"content": [{"type": "text", "text": "ok"}]})

        provider = _provider(httpx.MockTransport(handle))
        messages = [
            ChatMessage(role=MessageRole.USER, content="SYSTEME"),
            ChatMessage(role=MessageRole.USER, content="Deploie un postgres"),
        ]

        await provider.complete(messages, [])

        body = captured["body"]
        assert len(body["messages"]) == 1
        assert body["messages"][0]["role"] == "user"
        assert "SYSTEME" in body["messages"][0]["content"]
        assert "Deploie un postgres" in body["messages"][0]["content"]

    async def test_garantit_l_alternance_stricte_user_assistant(self) -> None:
        captured: dict[str, Any] = {}

        def handle(request: httpx.Request) -> httpx.Response:
            captured["body"] = json.loads(request.content)
            return httpx.Response(200, json={"content": [{"type": "text", "text": "ok"}]})

        provider = _provider(httpx.MockTransport(handle))
        messages = [
            ChatMessage(role=MessageRole.USER, content="SYSTEME"),
            ChatMessage(role=MessageRole.USER, content="Q1"),
            ChatMessage(role=MessageRole.TOOL, content="resultat outil"),
            ChatMessage(role=MessageRole.ASSISTANT, content="Reponse"),
        ]

        await provider.complete(messages, [])

        roles = [m["role"] for m in captured["body"]["messages"]]
        assert all(roles[i] != roles[i + 1] for i in range(len(roles) - 1))
        assert roles[0] == "user"


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

    async def test_tool_use_paralleles_ne_concatenent_pas_les_args(self) -> None:
        # Claude peut emettre PLUSIEURS tool_use en parallele (parallel tool use,
        # blocs indexes 0,1,...). Les deltas `input_json_delta` de chaque bloc ne
        # doivent JAMAIS etre concatenes ensemble, sinon json.loads leve
        # « Extra data » (500 en prod). On retient le 1er tool_use.
        async def stream_body() -> AsyncIterator[bytes]:
            frames: list[dict[str, Any]] = [
                {
                    "type": "content_block_start",
                    "index": 0,
                    "content_block": {"type": "tool_use", "name": "get_template"},
                },
                {
                    "type": "content_block_delta",
                    "index": 0,
                    "delta": {"type": "input_json_delta", "partial_json": '{"template_id":'},
                },
                {
                    "type": "content_block_delta",
                    "index": 0,
                    "delta": {"type": "input_json_delta", "partial_json": ' "abc"}'},
                },
                {"type": "content_block_stop", "index": 0},
                {
                    "type": "content_block_start",
                    "index": 1,
                    "content_block": {"type": "tool_use", "name": "list_catalog"},
                },
                {
                    "type": "content_block_delta",
                    "index": 1,
                    "delta": {"type": "input_json_delta", "partial_json": "{}"},
                },
                {"type": "content_block_stop", "index": 1},
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
        assert tool_chunks[0].tool_call.name == "get_template"
        assert tool_chunks[0].tool_call.args == {"template_id": "abc"}

    async def test_desactive_le_parallel_tool_use_quand_des_outils_sont_fournis(self) -> None:
        captured: dict[str, Any] = {}

        async def stream_body() -> AsyncIterator[bytes]:
            yield b'event: message_stop\ndata: {"type": "message_stop"}\n\n'

        def handle(request: httpx.Request) -> httpx.Response:
            captured["body"] = json.loads(request.content)
            return httpx.Response(200, content=stream_body())

        provider = _provider(httpx.MockTransport(handle))

        _ = [chunk async for chunk in provider.stream(_MESSAGES, _TOOLS)]

        # tool_choice auto + parallelisme desactive : Claude n'emet qu'un seul outil.
        assert captured["body"]["tool_choice"]["disable_parallel_tool_use"] is True
