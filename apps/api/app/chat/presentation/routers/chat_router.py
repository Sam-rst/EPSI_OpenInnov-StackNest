"""Router HTTP du chat IA : conversations (CRUD), messages (202 + SSE), actions.

Toutes les routes sont protegees par `get_current_user` et isolees par
proprietaire (un fil / une action d'autrui renvoie 404, on ne divulgue pas son
existence). L'envoi d'un message est asynchrone (202 Accepted) : le moteur
travaille et publie les tokens / propositions / resultats sur le canal Redis de
la conversation, consomme par le flux SSE (`text/event-stream`), meme mecanisme
que le deploiement. La confirmation d'une action delegue aux use cases du slice
deploiement (aucune duplication).
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse

from app.auth.domain.entities.user import User
from app.auth.presentation.dependencies.current_user import get_current_user
from app.chat.application.commands.send_message_command import SendMessageCommand
from app.chat.application.confirm_action import ConfirmAction
from app.chat.application.create_conversation import CreateConversation
from app.chat.application.delete_conversation import DeleteConversation
from app.chat.application.get_conversation import GetConversation
from app.chat.application.list_conversations import ListConversations
from app.chat.application.reject_action import RejectAction
from app.chat.application.rename_conversation import RenameConversation
from app.chat.application.send_message import SendMessage
from app.chat.domain.interfaces.catalog_reader import CatalogReader
from app.chat.domain.interfaces.chat_action_repository import ChatActionRepository
from app.chat.domain.interfaces.chat_event_publisher import ChatEventPublisher
from app.chat.domain.interfaces.chat_event_subscriber import ChatEventSubscriber
from app.chat.domain.interfaces.conversation_repository import ConversationRepository
from app.chat.domain.interfaces.deployment_actions import DeploymentActions
from app.chat.domain.interfaces.llm_provider import LLMProvider
from app.chat.infrastructure.tools.action_args_gate import ActionArgsGate
from app.chat.infrastructure.tools.read_tool_executor import ReadToolExecutor
from app.chat.infrastructure.tools.tool_catalog_builder import ToolCatalogBuilder
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
from app.chat.presentation.schemas.conversation_schemas import (
    ConversationDetailResponse,
    ConversationResponse,
    CreateConversationRequest,
    MessageResponse,
    RenameConversationRequest,
    SendMessageRequest,
)
from app.chat.presentation.schemas.sse_keepalive_stream import sse_keepalive_stream
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository

router = APIRouter(prefix="/chat", tags=["Chat IA"])

CurrentUserDep = Annotated[User, Depends(get_current_user)]
ConversationsDep = Annotated[ConversationRepository, Depends(get_conversation_repository)]
ActionsDep = Annotated[ChatActionRepository, Depends(get_chat_action_repository)]
CatalogDep = Annotated[CatalogReader, Depends(get_catalog_reader)]
DeploymentsDep = Annotated[DeploymentRepository, Depends(get_chat_deployment_repository)]
ProviderDep = Annotated[LLMProvider, Depends(get_llm_provider)]
PublisherDep = Annotated[ChatEventPublisher, Depends(get_chat_event_publisher)]
SubscriberDep = Annotated[ChatEventSubscriber, Depends(get_chat_event_subscriber)]
DelegateDep = Annotated[DeploymentActions, Depends(get_deployment_actions)]

# En-tetes SSE : flux non bufferise, connexion maintenue ouverte ; desactive le
# buffering Nginx (reverse-proxy) pour que chaque event parte immediatement.
_SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


@router.get("/conversations", response_model=list[ConversationResponse], summary="Liste des fils")
async def list_conversations(
    conversations: ConversationsDep, user: CurrentUserDep
) -> list[ConversationResponse]:
    """Renvoie les fils de discussion appartenant a l'utilisateur authentifie."""
    fils = await ListConversations(conversations).execute(user.id)
    return [ConversationResponse.from_entity(fil) for fil in fils]


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Creer un fil de discussion",
)
async def create_conversation(
    request: CreateConversationRequest, conversations: ConversationsDep, user: CurrentUserDep
) -> ConversationResponse:
    """Cree un fil pour l'utilisateur (titre par defaut si absent)."""
    fil = await CreateConversation(conversations).execute(owner_id=user.id, title=request.title)
    return ConversationResponse.from_entity(fil)


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailResponse,
    summary="Detail d'un fil possede (avec ses messages)",
)
async def get_conversation(
    conversation_id: UUID, conversations: ConversationsDep, user: CurrentUserDep
) -> ConversationDetailResponse:
    """Renvoie le fil et ses messages (404 si inconnu ou non possede)."""
    use_case = GetConversation(conversations)
    fil = await use_case.execute(conversation_id=conversation_id, owner_id=user.id)
    messages = await use_case.list_messages(conversation_id=conversation_id, owner_id=user.id)
    return ConversationDetailResponse(
        conversation=ConversationResponse.from_entity(fil),
        messages=[MessageResponse.from_entity(message) for message in messages],
    )


@router.patch(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    summary="Renommer un fil possede",
)
async def rename_conversation(
    conversation_id: UUID,
    request: RenameConversationRequest,
    conversations: ConversationsDep,
    user: CurrentUserDep,
) -> ConversationResponse:
    """Renomme un fil de l'utilisateur (404 si inconnu ou non possede)."""
    fil = await RenameConversation(conversations).execute(
        conversation_id=conversation_id, owner_id=user.id, title=request.title
    )
    return ConversationResponse.from_entity(fil)


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un fil possede",
)
async def delete_conversation(
    conversation_id: UUID, conversations: ConversationsDep, user: CurrentUserDep
) -> None:
    """Supprime un fil de l'utilisateur (404 si inconnu ou non possede)."""
    await DeleteConversation(conversations).execute(
        conversation_id=conversation_id, owner_id=user.id
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Envoyer un message (traitement asynchrone, suivi via SSE)",
)
async def send_message(
    conversation_id: UUID,
    request: SendMessageRequest,
    conversations: ConversationsDep,
    actions: ActionsDep,
    publisher: PublisherDep,
    provider: ProviderDep,
    catalog: CatalogDep,
    deployments: DeploymentsDep,
    user: CurrentUserDep,
) -> None:
    """Traite le message (404 si fil non possede) puis diffuse la reponse en SSE."""
    send = SendMessage(
        provider=provider,
        conversations=conversations,
        actions=actions,
        publisher=publisher,
        tool_builder=ToolCatalogBuilder(catalog),
        gate=ActionArgsGate(catalog=catalog, deployments=deployments),
        read_executor=ReadToolExecutor(catalog=catalog, deployments=deployments),
    )
    await send.execute(
        SendMessageCommand(
            conversation_id=conversation_id, owner_id=user.id, content=request.content
        )
    )


@router.get(
    "/conversations/{conversation_id}/stream",
    summary="Flux SSE des evenements d'une conversation possedee",
)
async def stream_conversation(
    conversation_id: UUID,
    conversations: ConversationsDep,
    subscriber: SubscriberDep,
    user: CurrentUserDep,
) -> StreamingResponse:
    """Stream SSE (`text/event-stream`) des events de la conversation de l'utilisateur.

    Verifie d'abord l'appartenance (404 synchrone) AVANT d'ouvrir le flux, puis
    pousse chaque `ChatEvent` du canal Redis tant que la connexion reste ouverte.
    """
    await GetConversation(conversations).execute(conversation_id=conversation_id, owner_id=user.id)

    # Keepalive : un LLM lent (Ollama CPU) peut rester muet ~30 s ; sans trafic la
    # connexion idle est coupee. Le wrapper insere un commentaire SSE periodique.
    events = sse_keepalive_stream(subscriber.subscribe(conversation_id))

    return StreamingResponse(events, media_type="text/event-stream", headers=_SSE_HEADERS)


@router.post(
    "/actions/{action_id}/confirm",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Confirmer une action proposee (delegue au deploiement)",
)
async def confirm_action(
    action_id: UUID,
    conversations: ConversationsDep,
    actions: ActionsDep,
    publisher: PublisherDep,
    delegate: DelegateDep,
    user: CurrentUserDep,
) -> None:
    """Confirme l'action de l'utilisateur (404 si inconnue / non possedee / non proposed)."""
    await ConfirmAction(
        conversations=conversations, actions=actions, publisher=publisher, delegate=delegate
    ).execute(action_id=action_id, owner_id=user.id)


@router.post(
    "/actions/{action_id}/reject",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Rejeter une action proposee",
)
async def reject_action(
    action_id: UUID,
    conversations: ConversationsDep,
    actions: ActionsDep,
    publisher: PublisherDep,
    user: CurrentUserDep,
) -> None:
    """Rejette l'action de l'utilisateur (404 si inconnue / non possedee / non proposed)."""
    await RejectAction(conversations=conversations, actions=actions, publisher=publisher).execute(
        action_id=action_id, owner_id=user.id
    )
