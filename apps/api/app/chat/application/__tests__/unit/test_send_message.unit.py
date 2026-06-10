"""Tests unitaires du use case SendMessage (moteur de conversation).

Verifie le coeur du moteur : persistance du message user, diffusion des tokens
via le publieur SSE, persistance du message assistant final, execution immediate
des outils de LECTURE (resultat reinjecte puis nouvelle passe LLM), et production
d'une `ActionProposal` (event `action_proposed` + `ChatAction` persistee) pour un
outil d'ACTION. Isolation owner. Aucun appel LLM reseau (FakeLLMProvider).
"""

from collections.abc import AsyncIterator, Sequence
from uuid import UUID, uuid4

import pytest

from app.chat.application.__tests__.fakes import (
    FakeCatalogReader,
    FakeChatActionRepository,
    FakeChatEventPublisher,
    FakeConversationRepository,
    make_param,
    make_template,
)
from app.chat.application.commands.send_message_command import SendMessageCommand
from app.chat.application.send_message import SendMessage
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.exceptions.conversation_not_found import ConversationNotFoundException
from app.chat.domain.value_objects.chat_message import ChatMessage
from app.chat.domain.value_objects.llm_chunk import LLMChunk
from app.chat.domain.value_objects.tool_call import ToolCall
from app.chat.domain.value_objects.tool_definition import ToolDefinition
from app.chat.infrastructure.llm.fake_llm_provider import FakeLLMProvider
from app.chat.infrastructure.tools.action_args_gate import ActionArgsGate
from app.chat.infrastructure.tools.read_tool_executor import ReadToolExecutor
from app.chat.infrastructure.tools.tool_catalog_builder import ToolCatalogBuilder
from app.chat.infrastructure.tools.tool_names import ToolName
from app.deployment.application.__tests__.fakes import (
    FakeDeploymentRepository,
)


def _conversation(owner_id: UUID) -> Conversation:
    return Conversation(id=uuid4(), owner_id=owner_id, title="Mon fil")


def _build_send_message(
    *,
    provider: FakeLLMProvider,
    conversations: FakeConversationRepository,
    actions: FakeChatActionRepository,
    publisher: FakeChatEventPublisher,
    catalog: FakeCatalogReader,
    deployments: FakeDeploymentRepository,
) -> SendMessage:
    return SendMessage(
        provider=provider,
        conversations=conversations,
        actions=actions,
        publisher=publisher,
        tool_builder=ToolCatalogBuilder(catalog),
        gate=ActionArgsGate(catalog=catalog, deployments=deployments),
        read_executor=ReadToolExecutor(catalog=catalog, deployments=deployments),
    )


class TestTextResponse:
    async def test_persiste_le_message_user_et_l_assistant(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        conversations = FakeConversationRepository([conversation])
        publisher = FakeChatEventPublisher()
        send = _build_send_message(
            provider=FakeLLMProvider(text="Bonjour, je peux vous aider."),
            conversations=conversations,
            actions=FakeChatActionRepository(),
            publisher=publisher,
            catalog=FakeCatalogReader([]),
            deployments=FakeDeploymentRepository(),
        )

        await send.execute(
            SendMessageCommand(conversation_id=conversation.id, owner_id=owner, content="Salut")
        )

        roles = [message.role for message in conversations.added_messages]
        assert MessageRole.USER in roles
        assert MessageRole.ASSISTANT in roles
        assistant = next(m for m in conversations.added_messages if m.role == MessageRole.ASSISTANT)
        assert assistant.content == "Bonjour, je peux vous aider."

    async def test_diffuse_les_tokens_puis_un_event_message_final(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        publisher = FakeChatEventPublisher()
        send = _build_send_message(
            provider=FakeLLMProvider(chunks=["Bon", "jour"]),
            conversations=FakeConversationRepository([conversation]),
            actions=FakeChatActionRepository(),
            publisher=publisher,
            catalog=FakeCatalogReader([]),
            deployments=FakeDeploymentRepository(),
        )

        await send.execute(
            SendMessageCommand(conversation_id=conversation.id, owner_id=owner, content="Salut")
        )

        assert publisher.tokens() == "Bonjour"
        assert publisher.names()[-1] == "message"

    async def test_transmet_l_historique_au_modele(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        conversations = FakeConversationRepository([conversation])
        provider = FakeLLMProvider(text="ok")
        send = _build_send_message(
            provider=provider,
            conversations=conversations,
            actions=FakeChatActionRepository(),
            publisher=FakeChatEventPublisher(),
            catalog=FakeCatalogReader([]),
            deployments=FakeDeploymentRepository(),
        )

        await send.execute(
            SendMessageCommand(
                conversation_id=conversation.id, owner_id=owner, content="Quoi de neuf ?"
            )
        )

        last_call = provider.calls[-1]
        assert any(m.role == MessageRole.USER and "neuf" in m.content for m in last_call)


class TestOwnership:
    async def test_conversation_inconnue_leve_404(self) -> None:
        send = _build_send_message(
            provider=FakeLLMProvider(text="x"),
            conversations=FakeConversationRepository([]),
            actions=FakeChatActionRepository(),
            publisher=FakeChatEventPublisher(),
            catalog=FakeCatalogReader([]),
            deployments=FakeDeploymentRepository(),
        )

        with pytest.raises(ConversationNotFoundException):
            await send.execute(
                SendMessageCommand(conversation_id=uuid4(), owner_id=uuid4(), content="x")
            )

    async def test_conversation_d_autrui_leve_404(self) -> None:
        conversation = _conversation(uuid4())
        send = _build_send_message(
            provider=FakeLLMProvider(text="x"),
            conversations=FakeConversationRepository([conversation]),
            actions=FakeChatActionRepository(),
            publisher=FakeChatEventPublisher(),
            catalog=FakeCatalogReader([]),
            deployments=FakeDeploymentRepository(),
        )

        with pytest.raises(ConversationNotFoundException):
            await send.execute(
                SendMessageCommand(conversation_id=conversation.id, owner_id=uuid4(), content="x")
            )


class TestReadTool:
    async def test_outil_de_lecture_est_execute_immediatement_puis_reinjecte(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        template = make_template(name="PostgreSQL")
        # 1re passe : appel d'outil de lecture ; 2e passe : reponse texte.
        provider = _ScriptedProvider(
            [
                ToolCall(name=ToolName.LIST_CATALOG.value, args={}),
                "Vous pouvez deployer PostgreSQL.",
            ]
        )
        conversations = FakeConversationRepository([conversation])
        publisher = FakeChatEventPublisher()
        send = _build_send_message(
            provider=provider,
            conversations=conversations,
            actions=FakeChatActionRepository(),
            publisher=publisher,
            catalog=FakeCatalogReader([template]),
            deployments=FakeDeploymentRepository(),
        )

        await send.execute(
            SendMessageCommand(
                conversation_id=conversation.id, owner_id=owner, content="Que deployer ?"
            )
        )

        # Le resultat de l'outil a ete reinjecte : la 2e passe a vu un message tool.
        second_call = provider.calls[-1]
        assert any(m.role == MessageRole.TOOL for m in second_call)
        assert publisher.tokens() == "Vous pouvez deployer PostgreSQL."


class TestActionTool:
    async def test_outil_d_action_produit_une_proposition_et_la_persiste(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        template = make_template(versions=["16"])
        actions = FakeChatActionRepository()
        publisher = FakeChatEventPublisher()
        provider = FakeLLMProvider(
            tool_call=ToolCall(
                name=ToolName.DEPLOY_TEMPLATE.value,
                args={"template_id": str(template.id), "version": "16", "name": "db", "params": {}},
            )
        )
        send = _build_send_message(
            provider=provider,
            conversations=FakeConversationRepository([conversation]),
            actions=actions,
            publisher=publisher,
            catalog=FakeCatalogReader([template]),
            deployments=FakeDeploymentRepository(),
        )

        await send.execute(
            SendMessageCommand(
                conversation_id=conversation.id, owner_id=owner, content="Deploie une base"
            )
        )

        assert len(actions.added) == 1
        assert actions.added[0].status is ActionStatus.PROPOSED
        assert "action_proposed" in publisher.names()
        proposed = next(p for c, n, p in publisher.events if n == "action_proposed")
        assert proposed["action_id"] == str(actions.added[0].id)

    async def test_deploy_incomplet_fait_redemander_l_ia_sans_erreur(self) -> None:
        # Elicitation guidee : un deploy sans le param requis (db_name) ne doit PAS
        # produire une erreur terminale ni une proposition ; la gate refuse, le
        # feedback est reinjecte, et l'IA redemande l'info manquante (texte).
        owner = uuid4()
        conversation = _conversation(owner)
        template = make_template(versions=["16"], params=[make_param(key="db_name", required=True)])
        actions = FakeChatActionRepository()
        publisher = FakeChatEventPublisher()
        provider = _ScriptedProvider(
            [
                ToolCall(
                    name=ToolName.DEPLOY_TEMPLATE.value,
                    args={
                        "template_id": str(template.id),
                        "version": "16",
                        "name": "db",
                        "params": {},
                    },
                ),
                "Quel nom de base de donnees veux-tu (db_name) ?",
            ]
        )
        send = _build_send_message(
            provider=provider,
            conversations=FakeConversationRepository([conversation]),
            actions=actions,
            publisher=publisher,
            catalog=FakeCatalogReader([template]),
            deployments=FakeDeploymentRepository(),
        )

        await send.execute(
            SendMessageCommand(
                conversation_id=conversation.id, owner_id=owner, content="Deploie un postgres"
            )
        )

        assert actions.added == []
        assert "error" not in publisher.names()
        assert "action_proposed" not in publisher.names()
        assert publisher.tokens() == "Quel nom de base de donnees veux-tu (db_name) ?"
        # Le feedback de la gate a ete reinjecte : la 2e passe a vu un message tool.
        assert any(m.role == MessageRole.TOOL for m in provider.calls[-1])

    async def test_template_hallucine_fait_redemander_sans_erreur(self) -> None:
        # Hallucination pure : la gate rejette un template hors catalogue ; au lieu
        # d'une erreur terminale, on reboucle avec un feedback honnete -> l'IA
        # reformule en s'appuyant sur le catalogue reel.
        owner = uuid4()
        conversation = _conversation(owner)
        template = make_template()
        actions = FakeChatActionRepository()
        publisher = FakeChatEventPublisher()
        provider = _ScriptedProvider(
            [
                ToolCall(
                    name=ToolName.DEPLOY_TEMPLATE.value,
                    args={
                        "template_id": str(uuid4()),
                        "version": "16",
                        "name": "db",
                        "params": {},
                    },
                ),
                "Ce template n'existe pas dans le catalogue ; je peux deployer PostgreSQL.",
            ]
        )
        send = _build_send_message(
            provider=provider,
            conversations=FakeConversationRepository([conversation]),
            actions=actions,
            publisher=publisher,
            catalog=FakeCatalogReader([template]),
            deployments=FakeDeploymentRepository(),
        )

        await send.execute(
            SendMessageCommand(
                conversation_id=conversation.id, owner_id=owner, content="Deploie le truc X"
            )
        )

        assert actions.added == []
        assert "error" not in publisher.names()
        assert publisher.tokens().startswith("Ce template")
        assert any(m.role == MessageRole.TOOL for m in provider.calls[-1])

    async def test_boucle_bornee_si_le_modele_insiste_sur_un_appel_invalide(self) -> None:
        # Garde-fou anti-emballement : si le modele rappelle sans fin un outil
        # invalide (jamais de question, jamais de correction), la boucle bornee
        # finit par publier une erreur honnete, sans jamais proposer d'action.
        owner = uuid4()
        conversation = _conversation(owner)
        actions = FakeChatActionRepository()
        publisher = FakeChatEventPublisher()
        provider = FakeLLMProvider(
            tool_call=ToolCall(
                name=ToolName.DEPLOY_TEMPLATE.value,
                args={"template_id": str(uuid4()), "version": "16", "name": "db", "params": {}},
            )
        )
        send = _build_send_message(
            provider=provider,
            conversations=FakeConversationRepository([conversation]),
            actions=actions,
            publisher=publisher,
            catalog=FakeCatalogReader([]),
            deployments=FakeDeploymentRepository(),
        )

        await send.execute(
            SendMessageCommand(
                conversation_id=conversation.id, owner_id=owner, content="Deploie n'importe quoi"
            )
        )

        assert actions.added == []
        assert "action_proposed" not in publisher.names()
        assert "error" in publisher.names()


class _ScriptedProvider(FakeLLMProvider):
    """Provider scripte multi-passes : rejoue une sequence (ToolCall | texte)."""

    def __init__(self, script: list[ToolCall | str]) -> None:
        super().__init__()
        self._script = list(script)
        self._index = 0

    def _next_step(self) -> ToolCall | str:
        step = self._script[min(self._index, len(self._script) - 1)]
        self._index += 1
        return step

    async def stream(
        self, messages: Sequence[ChatMessage], tools: Sequence[ToolDefinition]
    ) -> AsyncIterator[LLMChunk]:
        self.calls.append(list(messages))
        step = self._next_step()
        if isinstance(step, ToolCall):
            yield LLMChunk.of_tool_call(step)
        else:
            yield LLMChunk.of_text(step)

    async def complete(
        self, messages: Sequence[ChatMessage], tools: Sequence[ToolDefinition]
    ) -> LLMChunk:
        self.calls.append(list(messages))
        step = self._next_step()
        if isinstance(step, ToolCall):
            return LLMChunk.of_tool_call(step)
        return LLMChunk.of_text(step)
