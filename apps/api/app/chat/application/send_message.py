"""Use case SendMessage : moteur de conversation du chat IA.

Orchestre une passe de conversation : persiste le message user, construit le
contexte (systeme + historique + resultats d'outils), interroge le `LLMProvider`
en streaming et route le flux :

- fragments de texte -> events `token` (SSE) puis, en fin de flux, persistance du
  message assistant + event `message` ;
- appel d'un outil de LECTURE -> execution immediate, resultat reinjecte comme
  message `tool`, nouvelle passe LLM (boucle bornee anti-emballement) ;
- appel d'un outil d'ACTION -> validation par la gate anti-hallucination ->
  persistance d'une `ChatAction` (status `proposed`) + event `action_proposed`.
  Une action invalide produit un event `error` (reformulation), sans persister.

Aucune logique de provisioning ici : l'execution reelle d'une action est deleguee
au slice `deployment` par `ConfirmAction`, jamais par ce use case.
"""

import json
from collections.abc import Sequence
from typing import Any
from uuid import UUID, uuid4

import structlog

from app.chat.application.commands.send_message_command import SendMessageCommand
from app.chat.application.conversation_access import load_owned_conversation
from app.chat.application.conversation_titler import ConversationTitler
from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.exceptions.invalid_tool_args import InvalidToolArgsException
from app.chat.domain.exceptions.unknown_template import UnknownTemplateException
from app.chat.domain.interfaces.chat_action_repository import ChatActionRepository
from app.chat.domain.interfaces.chat_event_publisher import ChatEventPublisher
from app.chat.domain.interfaces.conversation_repository import ConversationRepository
from app.chat.domain.interfaces.llm_provider import LLMProvider
from app.chat.domain.value_objects.chat_message import ChatMessage
from app.chat.domain.value_objects.tool_call import ToolCall
from app.chat.domain.value_objects.tool_definition import ToolDefinition
from app.chat.infrastructure.tools.action_args_gate import ActionArgsGate
from app.chat.infrastructure.tools.read_tool_executor import ReadToolExecutor
from app.chat.infrastructure.tools.tool_catalog_builder import ToolCatalogBuilder
from app.chat.infrastructure.tools.tool_names import READ_TOOLS, ToolName

_logger = structlog.get_logger(__name__)

# Borne du nombre de passes LLM enchainees par execution d'outils de lecture :
# protege contre une boucle d'appels d'outils sans fin (anti-emballement).
_MAX_TOOL_PASSES = 5

_SYSTEM_PROMPT = (
    "Tu es l'assistant de StackNest, une plateforme de provisioning interne. "
    "Tu reponds en francais, de facon concise. Tu n'utilises QUE les outils fournis "
    "et ne references QUE des ressources reelles renvoyees par ces outils : tu "
    "n'inventes jamais un identifiant, une version ou une valeur. Tu ne divulgues "
    "aucun secret.\n"
    "Tu es un assistant GUIDE : avant de proposer un deploiement, tu recueilles le "
    "besoin en posant des questions. Procede ainsi :\n"
    "1. Identifie le template voulu (appelle list_catalog ou get_template au besoin) ; "
    "si c'est ambigu, demande a l'utilisateur de preciser.\n"
    "2. Appelle get_template pour connaitre ses parametres, puis pose les questions "
    "necessaires (1 a 3 a la fois) : usage, nom du deploiement, version souhaitee, et "
    "chaque parametre requis. Ne devine jamais une valeur : en cas de doute, demande.\n"
    "3. Des que tu as reuni le nom et tous les parametres requis, APPELLE directement "
    "l'outil deploy_template. N'ecris JAMAIS la proposition en texte et ne redemande "
    "pas une enieme confirmation : c'est l'outil lui-meme qui produit la carte de "
    "proposition que l'utilisateur confirmera. Tu ne declenches donc jamais un "
    "deploiement reel, tu emets seulement l'appel d'outil.\n"
    "Deployabilite : chaque template du catalogue porte un champ `deployable` "
    "(booleen) et un `blocked_reason`. Ne propose JAMAIS de deployer "
    "(deploy_template) un service dont `deployable` est `false`. Explique honnetement "
    "pourquoi il n'est pas encore deployable selon `blocked_reason` : `terraform` "
    "signifie que les deploiements Terraform (VM, reseau, bucket) arrivent bientot ; "
    "`runtime` signifie que le runtime de ce langage (Node, Python, Go, PHP) sera "
    "bientot disponible. Dans ce cas, propose une alternative deployable pertinente "
    "du catalogue (un template dont `deployable` est `true`).\n"
    "Si un outil signale une information manquante ou invalide, pose la question "
    "correspondante a l'utilisateur (ou propose une alternative reelle du catalogue) "
    "plutot que de rappeler l'outil a l'aveugle."
)


class SendMessage:
    """Execute une passe de conversation et diffuse le resultat via le publieur."""

    def __init__(
        self,
        *,
        provider: LLMProvider,
        conversations: ConversationRepository,
        actions: ChatActionRepository,
        publisher: ChatEventPublisher,
        tool_builder: ToolCatalogBuilder,
        gate: ActionArgsGate,
        read_executor: ReadToolExecutor,
        titler: ConversationTitler,
    ) -> None:
        self._provider = provider
        self._conversations = conversations
        self._actions = actions
        self._publisher = publisher
        self._tool_builder = tool_builder
        self._gate = gate
        self._read_executor = read_executor
        self._titler = titler

    async def execute(self, command: SendMessageCommand) -> None:
        """Traite le message user et diffuse la reponse (texte ou proposition)."""
        conversation = await load_owned_conversation(
            self._conversations, command.conversation_id, command.owner_id
        )
        # Detecte le 1er message AVANT de le persister : a ce moment le fil est vide.
        is_first_message = not await self._conversations.list_messages(conversation.id)
        await self._persist_message(conversation.id, MessageRole.USER, command.content)

        if is_first_message:
            await self._title_conversation(conversation, command.content)

        history = await self._build_history(conversation.id)
        tools = await self._tool_builder.build()
        await self._run_passes(conversation.id, command.owner_id, history, tools)

    async def _title_conversation(self, conversation: Conversation, first_message: str) -> None:
        """Genere un titre court du fil depuis le 1er message, le persiste et le diffuse.

        Le titre est emis AVANT la reponse pour apparaitre vite dans la sidebar
        (event SSE `title`). Best-effort : un echec LLM ne casse jamais le tour —
        le fil conserve alors son titre par defaut.
        """
        try:
            title = await self._titler.generate(first_message)
        except Exception:  # frontiere infra LLM : le titrage ne doit pas casser le tour
            _logger.warning("chat.title.generation_failed", conversation_id=str(conversation.id))
            return
        conversation.title = title
        await self._conversations.update(conversation)
        await self._publisher.publish(conversation.id, "title", {"title": title})

    async def _run_passes(
        self,
        conversation_id: UUID,
        owner_id: UUID,
        history: list[ChatMessage],
        tools: Sequence[ToolDefinition],
    ) -> None:
        for _ in range(_MAX_TOOL_PASSES):
            text, tool_call = await self._stream_one_pass(conversation_id, history, tools)
            if tool_call is None:
                await self._finish_with_text(conversation_id, text)
                return
            if self._is_read_tool(tool_call):
                await self._inject_read_result(conversation_id, owner_id, history, tool_call)
                continue
            if await self._try_propose_action(conversation_id, owner_id, history, tool_call):
                return
            # Action refusee par la gate (info manquante / hallucination) : le feedback
            # a ete reinjecte dans l'historique -> l'IA redemande ou reformule (passe
            # suivante), au lieu d'une erreur terminale. C'est le coeur de l'elicitation.
        # Boucle bornee atteinte : on conclut proprement sans message assistant.
        await self._publisher.publish(
            conversation_id, "error", {"message": "Trop d'appels d'outils enchaines."}
        )

    async def _stream_one_pass(
        self,
        conversation_id: UUID,
        history: list[ChatMessage],
        tools: Sequence[ToolDefinition],
    ) -> tuple[str, ToolCall | None]:
        text_parts: list[str] = []
        async for chunk in self._provider.stream(history, tools):
            if chunk.is_tool_call():
                assert chunk.tool_call is not None
                return "".join(text_parts), chunk.tool_call
            assert chunk.delta is not None
            text_parts.append(chunk.delta)
            await self._publisher.publish(conversation_id, "token", {"delta": chunk.delta})
        return "".join(text_parts), None

    async def _finish_with_text(self, conversation_id: UUID, text: str) -> None:
        await self._persist_message(conversation_id, MessageRole.ASSISTANT, text)
        await self._publisher.publish(conversation_id, "message", {"content": text})

    async def _inject_read_result(
        self,
        conversation_id: UUID,
        owner_id: UUID,
        history: list[ChatMessage],
        call: ToolCall,
    ) -> None:
        result = await self._read_executor.execute(call, owner_id=owner_id)
        tool_message = self._format_tool_result(call.name, result)
        await self._persist_message(conversation_id, MessageRole.TOOL, tool_message)
        history.append(ChatMessage(role=MessageRole.TOOL, content=tool_message))

    async def _try_propose_action(
        self, conversation_id: UUID, owner_id: UUID, history: list[ChatMessage], call: ToolCall
    ) -> bool:
        """Tente de proposer l'action ; renvoie True si la proposition a ete publiee.

        Si la gate refuse l'appel (parametre requis manquant, nom absent, entite hors
        catalogue), on **ne publie pas d'erreur terminale** : on reinjecte le motif
        comme feedback (message `tool` transitoire, non persiste) pour que l'IA
        redemande l'information a l'utilisateur a la passe suivante. Renvoie False.
        """
        try:
            proposal = await self._gate.validate(call, owner_id=owner_id)
        except (InvalidToolArgsException, UnknownTemplateException) as error:
            history.append(
                ChatMessage(
                    role=MessageRole.TOOL,
                    content=self._clarification_feedback(call.name, error.message),
                )
            )
            return False
        assistant = await self._persist_message(
            conversation_id, MessageRole.ASSISTANT, proposal.restatement
        )
        action = ChatAction(
            id=uuid4(),
            conversation_id=conversation_id,
            message_id=assistant.id,
            kind=proposal.kind,
            status=ActionStatus.PROPOSED,
            args=proposal.args,
        )
        persisted = await self._actions.add(action)
        await self._publisher.publish(
            conversation_id,
            "action_proposed",
            {
                "action_id": str(persisted.id),
                "kind": proposal.kind.value,
                "restatement": proposal.restatement,
                "recap": proposal.recap,
            },
        )
        return True

    @staticmethod
    def _clarification_feedback(tool_name: str, reason: str) -> str:
        """Message `tool` guidant l'IA a redemander l'info plutot qu'a reessayer."""
        return (
            f"[{tool_name}] Action non proposable : {reason} "
            "Demande a l'utilisateur, en langage naturel, les informations manquantes "
            "(ou propose une alternative reelle du catalogue). Ne rappelle pas cet "
            "outil tant que tu n'as pas obtenu ces informations."
        )

    async def _persist_message(
        self, conversation_id: UUID, role: MessageRole, content: str
    ) -> Message:
        return await self._conversations.add_message(
            Message(id=uuid4(), conversation_id=conversation_id, role=role, content=content)
        )

    async def _build_history(self, conversation_id: UUID) -> list[ChatMessage]:
        messages = await self._conversations.list_messages(conversation_id)
        # Le port `LLMProvider` ne porte que les roles user/assistant/tool : le
        # cadrage systeme est injecte en tete comme message `user` (chaque
        # adaptateur peut le promouvoir en message systeme natif au besoin).
        history = [ChatMessage(role=MessageRole.USER, content=_SYSTEM_PROMPT)]
        history.extend(
            ChatMessage(role=message.role, content=message.content) for message in messages
        )
        return history

    @staticmethod
    def _is_read_tool(call: ToolCall) -> bool:
        try:
            return ToolName(call.name) in READ_TOOLS
        except ValueError:
            return False

    @staticmethod
    def _format_tool_result(name: str, result: dict[str, Any]) -> str:
        return f"[{name}] {json.dumps(result, ensure_ascii=False)}"
