"""Tests d'integration du router de chat (httpx ASGI + fakes infra + FakeLLM).

Monte l'application FastAPI complete (`create_app`) et remplace les providers
d'infrastructure du slice chat par des faux en memoire (repositories, publieur /
abonne d'evenements, LLM factice, delegation deploiement). L'authentification
utilise des jetons reels mintes par `JwtTokenService` ; le depot d'utilisateurs
est un faux. AUCUN appel LLM reseau, aucune base ni Redis reels.

Couvre : protection 401, CRUD des fils, isolation owner (404), envoi de message
(202) avec diffusion SSE des tokens via le publieur, proposition d'action
(event `action_proposed`), confirmation deleguee au deploiement, rejet, et flux
SSE de la conversation.
"""

from collections.abc import AsyncIterator
from uuid import UUID, uuid4

import httpx
import pytest
from fastapi import FastAPI

from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.value_objects.email import Email
from app.auth.infrastructure.security.jwt_token_service import JwtTokenService
from app.auth.presentation.dependencies.current_user import (
    get_token_service,
    get_user_repository,
)
from app.catalog.domain.entities.template import Template
from app.chat.application.__tests__.fakes import (
    FakeCatalogReader,
    FakeChatActionRepository,
    FakeChatEventPublisher,
    FakeConversationRepository,
    FakeDeploymentActions,
    make_template,
)
from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.interfaces.chat_event_subscriber import ChatEventSubscriber
from app.chat.domain.value_objects.chat_event import ChatEvent
from app.chat.domain.value_objects.tool_call import ToolCall
from app.chat.infrastructure.llm.fake_llm_provider import FakeLLMProvider
from app.chat.infrastructure.tools.tool_names import ToolName
from app.chat.presentation.dependencies.chat_providers import (
    get_catalog_reader,
    get_chat_action_repository,
    get_chat_deployment_repository,
    get_chat_event_publisher,
    get_chat_event_subscriber,
    get_conversation_repository,
    get_deployment_actions,
    get_llm_provider,
)
from app.deployment.application.__tests__.fakes import FakeDeploymentRepository
from app.main import create_app

_SECRET = "secret-de-test-suffisamment-long-pour-hs256-32o"


class _FakeUserRepository:
    def __init__(self, users: list[User]) -> None:
        self._by_id = {str(user.id): user for user in users}

    async def get_by_id(self, user_id: object) -> User | None:
        return self._by_id.get(str(user_id))


class _FakeChatEventSubscriber(ChatEventSubscriber):
    """Abonne en memoire : rejoue une sequence figee d'events puis se termine."""

    def __init__(self, events: list[ChatEvent]) -> None:
        self._events = events

    async def subscribe(self, conversation_id: UUID) -> AsyncIterator[ChatEvent]:
        for event in self._events:
            yield event


def _make_user() -> User:
    return User(
        id=uuid4(),
        email=Email("user@stacknest.local"),
        password_hash="$2b$12$hash",
        role=UserRole.USER,
        is_verified=True,
        token_version=0,
    )


def _auth(user: User) -> dict[str, str]:
    token = JwtTokenService(secret=_SECRET).issue(
        subject=user.id,
        purpose=TokenPurpose.ACCESS,
        role=user.role,
        token_version=user.token_version,
        ttl_seconds=900,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def context() -> AsyncIterator[dict[str, object]]:
    user = _make_user()
    other = _make_user()
    conversations = FakeConversationRepository()
    actions = FakeChatActionRepository()
    publisher = FakeChatEventPublisher()
    template = make_template(versions=["16"])
    catalog = FakeCatalogReader([template])
    deployments = FakeDeploymentRepository()
    delegate = FakeDeploymentActions(deployment_id="dep-xyz")
    subscriber = _FakeChatEventSubscriber(
        [ChatEvent("token", {"delta": "Bonjour"}), ChatEvent("message", {"content": "Bonjour"})]
    )

    app = create_app()
    app.dependency_overrides[get_token_service] = lambda: JwtTokenService(secret=_SECRET)
    app.dependency_overrides[get_user_repository] = lambda: _FakeUserRepository([user, other])
    app.dependency_overrides[get_conversation_repository] = lambda: conversations
    app.dependency_overrides[get_chat_action_repository] = lambda: actions
    app.dependency_overrides[get_catalog_reader] = lambda: catalog
    app.dependency_overrides[get_chat_deployment_repository] = lambda: deployments
    app.dependency_overrides[get_chat_event_publisher] = lambda: publisher
    app.dependency_overrides[get_chat_event_subscriber] = lambda: subscriber
    app.dependency_overrides[get_deployment_actions] = lambda: delegate
    app.dependency_overrides[get_llm_provider] = lambda: FakeLLMProvider(text="Bonjour")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="https://test") as http:
        yield {
            "app": app,
            "http": http,
            "user": user,
            "other": other,
            "conversations": conversations,
            "actions": actions,
            "publisher": publisher,
            "delegate": delegate,
            "template": template,
        }


class TestProtection:
    async def test_liste_sans_jeton_renvoie_401(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]

        response = await http.get("/chat/conversations")

        assert response.status_code in (401, 403)


class TestConversationCrud:
    async def test_cree_et_liste_un_fil(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]

        created = await http.post(
            "/chat/conversations", json={"title": "Mon fil"}, headers=_auth(user)
        )
        assert created.status_code == 201, created.text
        assert created.json()["title"] == "Mon fil"

        listed = await http.get("/chat/conversations", headers=_auth(user))
        assert [c["title"] for c in listed.json()] == ["Mon fil"]

    async def test_renomme_un_fil(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=user.id, title="ancien")
        await conversations.add(fil)

        response = await http.patch(
            f"/chat/conversations/{fil.id}", json={"title": "nouveau"}, headers=_auth(user)
        )

        assert response.status_code == 200
        assert response.json()["title"] == "nouveau"

    async def test_supprime_un_fil(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=user.id, title="a-supprimer")
        await conversations.add(fil)

        response = await http.delete(f"/chat/conversations/{fil.id}", headers=_auth(user))

        assert response.status_code == 204
        assert await conversations.get_by_id(fil.id) is None

    async def test_detail_d_un_fil_d_autrui_renvoie_404(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        other: User = context["other"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=other.id, title="pas-a-moi")
        await conversations.add(fil)

        response = await http.get(f"/chat/conversations/{fil.id}", headers=_auth(user))

        assert response.status_code == 404

    async def test_detail_rejoue_la_proposition_proposed(self, context: dict[str, object]) -> None:
        # Au rechargement, le message assistant porteur d'une action `proposed`
        # ressort avec son recap PUBLIC rattache (carte rejouable cote front).
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        actions: FakeChatActionRepository = context["actions"]  # type: ignore[assignment]
        template: Template = context["template"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=user.id, title="fil")
        await conversations.add(fil)
        assistant = Message(
            id=uuid4(),
            conversation_id=fil.id,
            role=MessageRole.ASSISTANT,
            content="Déployer PostgreSQL (version 16) sous le nom « db ».",
        )
        await conversations.add_message(assistant)
        await actions.add(
            ChatAction(
                id=uuid4(),
                conversation_id=fil.id,
                message_id=assistant.id,
                kind=ActionKind.DEPLOY,
                status=ActionStatus.PROPOSED,
                args={
                    "template_id": str(template.id),
                    "version": "16",
                    "name": "db",
                    "params": {},
                },
            )
        )

        response = await http.get(f"/chat/conversations/{fil.id}", headers=_auth(user))

        assert response.status_code == 200, response.text
        body = response.json()
        message = body["messages"][0]
        assert message["action"] is not None
        assert message["action"]["kind"] == "deploy"
        assert message["action"]["restatement"] == assistant.content
        assert message["action"]["recap"]["template"] == template.name
        # Le recap public ne porte pas l'id technique du template.
        assert str(template.id) not in str(message["action"]["recap"])

    async def test_detail_n_attache_pas_d_action_terminee(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        actions: FakeChatActionRepository = context["actions"]  # type: ignore[assignment]
        template: Template = context["template"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=user.id, title="fil")
        await conversations.add(fil)
        assistant = Message(
            id=uuid4(),
            conversation_id=fil.id,
            role=MessageRole.ASSISTANT,
            content="Déjà exécutée.",
        )
        await conversations.add_message(assistant)
        await actions.add(
            ChatAction(
                id=uuid4(),
                conversation_id=fil.id,
                message_id=assistant.id,
                kind=ActionKind.DEPLOY,
                status=ActionStatus.EXECUTED,
                args={
                    "template_id": str(template.id),
                    "version": "16",
                    "name": "db",
                    "params": {},
                },
            )
        )

        response = await http.get(f"/chat/conversations/{fil.id}", headers=_auth(user))

        assert response.status_code == 200
        assert response.json()["messages"][0]["action"] is None


class TestSendMessage:
    async def test_envoi_renvoie_202_et_diffuse_les_tokens(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        publisher: FakeChatEventPublisher = context["publisher"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=user.id, title="fil")
        await conversations.add(fil)

        response = await http.post(
            f"/chat/conversations/{fil.id}/messages",
            json={"content": "Salut"},
            headers=_auth(user),
        )

        assert response.status_code == 202, response.text
        assert publisher.tokens() == "Bonjour"
        assert publisher.names()[-1] == "message"

    async def test_envoi_sur_fil_d_autrui_renvoie_404(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        other: User = context["other"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=other.id, title="fil")
        await conversations.add(fil)

        response = await http.post(
            f"/chat/conversations/{fil.id}/messages",
            json={"content": "Salut"},
            headers=_auth(user),
        )

        assert response.status_code == 404

    async def test_message_vide_renvoie_422(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=user.id, title="fil")
        await conversations.add(fil)

        response = await http.post(
            f"/chat/conversations/{fil.id}/messages", json={"content": ""}, headers=_auth(user)
        )

        assert response.status_code == 422

    async def test_action_proposee_publie_action_proposed(self, context: dict[str, object]) -> None:
        app: FastAPI = context["app"]  # type: ignore[assignment]
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        actions: FakeChatActionRepository = context["actions"]  # type: ignore[assignment]
        publisher: FakeChatEventPublisher = context["publisher"]  # type: ignore[assignment]
        template: Template = context["template"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=user.id, title="fil")
        await conversations.add(fil)
        # Le LLM repond par un appel d'outil d'action valide.
        app.dependency_overrides[get_llm_provider] = lambda: FakeLLMProvider(
            tool_call=ToolCall(
                name=ToolName.DEPLOY_TEMPLATE.value,
                args={
                    "template_id": str(template.id),
                    "version": "16",
                    "name": "db",
                    "params": {},
                },
            )
        )

        response = await http.post(
            f"/chat/conversations/{fil.id}/messages",
            json={"content": "Deploie une base"},
            headers=_auth(user),
        )

        assert response.status_code == 202
        assert "action_proposed" in publisher.names()
        assert len(actions.added) == 1
        assert actions.added[0].status is ActionStatus.PROPOSED


class TestActions:
    async def test_confirmation_delegue_au_deploiement(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        actions: FakeChatActionRepository = context["actions"]  # type: ignore[assignment]
        delegate: FakeDeploymentActions = context["delegate"]  # type: ignore[assignment]
        template: Template = context["template"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=user.id, title="fil")
        await conversations.add(fil)
        action = ChatAction(
            id=uuid4(),
            conversation_id=fil.id,
            message_id=uuid4(),
            kind=ActionKind.DEPLOY,
            status=ActionStatus.PROPOSED,
            args={"template_id": str(template.id), "version": "16", "name": "db", "params": {}},
        )
        await actions.add(action)

        response = await http.post(f"/chat/actions/{action.id}/confirm", headers=_auth(user))

        assert response.status_code == 202, response.text
        assert [name for name, _ in delegate.calls] == ["deploy"]

    async def test_rejet_passe_l_action_en_rejected(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        actions: FakeChatActionRepository = context["actions"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=user.id, title="fil")
        await conversations.add(fil)
        action = ChatAction(
            id=uuid4(),
            conversation_id=fil.id,
            message_id=uuid4(),
            kind=ActionKind.STOP,
            status=ActionStatus.PROPOSED,
            args={"deployment_id": str(uuid4())},
        )
        await actions.add(action)

        response = await http.post(f"/chat/actions/{action.id}/reject", headers=_auth(user))

        assert response.status_code == 202
        assert actions.updated[-1].status is ActionStatus.REJECTED


class TestStream:
    async def test_stream_renvoie_text_event_stream(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=user.id, title="fil")
        await conversations.add(fil)

        async with http.stream(
            "GET", f"/chat/conversations/{fil.id}/stream", headers=_auth(user)
        ) as response:
            assert response.status_code == 200
            assert response.headers["content-type"].startswith("text/event-stream")
            body = await response.aread()

        text = body.decode()
        assert "event: token" in text
        assert "event: message" in text

    async def test_stream_d_un_fil_d_autrui_renvoie_404(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        other: User = context["other"]  # type: ignore[assignment]
        conversations: FakeConversationRepository = context["conversations"]  # type: ignore[assignment]
        fil = Conversation(id=uuid4(), owner_id=other.id, title="fil")
        await conversations.add(fil)

        response = await http.get(f"/chat/conversations/{fil.id}/stream", headers=_auth(user))

        assert response.status_code == 404
