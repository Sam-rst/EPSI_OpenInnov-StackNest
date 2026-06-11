"""Router HTTP des stacks : CRUD owner (creation / liste / detail / destruction) + SSE.

Toutes les routes sont protegees par `get_current_user` et isolees par
proprietaire : un utilisateur ne voit et n'agit que sur ses propres stacks (une
stack d'autrui renvoie 404, on ne divulgue pas son existence). La creation
persiste la stack en `pending` puis **enfile son provisioning** (worker `compose
up`) ; la suppression **enfile sa destruction** (worker `compose down -v`). Le
flux d'events est expose en SSE. Aucun secret ne figure dans les reponses ni dans
le flux SSE : les params `secret` des services sont masques, et un `StackEvent`
ne transporte jamais de secret (genere worker-side, environnement conteneur).
"""

from collections.abc import AsyncIterator
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse

from app.auth.domain.entities.user import User
from app.auth.presentation.dependencies.current_user import get_current_user
from app.stack.application.commands.stack_create_command import StackCreateCommand
from app.stack.application.commands.stack_link_command import StackLinkCommand
from app.stack.application.commands.stack_service_command import StackServiceCommand
from app.stack.application.create_stack import CreateStack
from app.stack.application.destroy_stack import DestroyStack
from app.stack.application.get_stack import GetStack
from app.stack.application.list_stacks import ListStacks
from app.stack.domain.interfaces.stack_event_subscriber import StackEventSubscriber
from app.stack.domain.interfaces.stack_job_queue import StackJobQueue
from app.stack.domain.interfaces.stack_repository import StackRepository
from app.stack.domain.interfaces.stack_template_reader import StackTemplateReader
from app.stack.presentation.dependencies.stack_providers import (
    get_stack_event_subscriber,
    get_stack_job_queue,
    get_stack_repository,
    get_stack_template_reader,
)
from app.stack.presentation.routers.secret_keys_resolver import SecretKeysResolver
from app.stack.presentation.schemas.stack_create_request import (
    StackCreateRequest,
    StackLinkRequest,
    StackServiceRequest,
)
from app.stack.presentation.schemas.stack_response import StackResponse
from app.stack.presentation.schemas.stack_sse_keepalive_stream import (
    stack_sse_keepalive_stream,
)

router = APIRouter(prefix="/stacks", tags=["Stack"])

CurrentUserDep = Annotated[User, Depends(get_current_user)]
RepositoryDep = Annotated[StackRepository, Depends(get_stack_repository)]
ReaderDep = Annotated[StackTemplateReader, Depends(get_stack_template_reader)]
QueueDep = Annotated[StackJobQueue, Depends(get_stack_job_queue)]
SubscriberDep = Annotated[StackEventSubscriber, Depends(get_stack_event_subscriber)]

# En-tetes SSE : flux non bufferise et connexion maintenue ouverte. `X-Accel-
# Buffering: no` desactive le buffering Nginx (reverse-proxy) pour que chaque
# event parte immediatement vers le client.
_SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


@router.post(
    "",
    response_model=StackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Creer une stack et lancer son provisioning",
)
async def create_stack(
    request: StackCreateRequest,
    repository: RepositoryDep,
    reader: ReaderDep,
    queue: QueueDep,
    user: CurrentUserDep,
) -> StackResponse:
    """Valide la composition, persiste la stack `pending` puis enfile son provisioning.

    Rejette (422) une composition invalide (alias dupliques, lien orphelin,
    cycle...) ou un service referencant un template/version inconnu ou non Docker.
    Le worker generera le compose-file et lancera `docker compose up` ; suivre le
    flux SSE `/stacks/{id}/events` pour la progression.
    """
    command = _to_command(request, user.id)
    stack = await CreateStack(repository=repository, reader=reader, queue=queue).execute(command)
    return StackResponse.from_stack(stack)


@router.get(
    "",
    response_model=list[StackResponse],
    summary="Liste des stacks de l'utilisateur",
)
async def list_stacks(
    repository: RepositoryDep,
    user: CurrentUserDep,
) -> list[StackResponse]:
    """Renvoie les stacks de l'utilisateur (resume, sans services ni liens)."""
    stacks = await ListStacks(repository).execute(user.id)
    return [StackResponse.from_stack(stack) for stack in stacks]


@router.get(
    "/{stack_id}",
    response_model=StackResponse,
    summary="Detail d'une stack possedee (services + liens)",
)
async def get_stack(
    stack_id: UUID,
    repository: RepositoryDep,
    reader: ReaderDep,
    user: CurrentUserDep,
) -> StackResponse:
    """Renvoie le detail d'une stack de l'utilisateur (secrets masques), ou 404."""
    detail = await GetStack(repository).execute(stack_id, user.id)
    secret_keys = await SecretKeysResolver(reader).resolve(detail.services)
    return StackResponse.from_detail(detail, secret_keys)


@router.delete(
    "/{stack_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Detruire une stack possedee (compose down -v, asynchrone)",
)
async def delete_stack(
    stack_id: UUID,
    repository: RepositoryDep,
    queue: QueueDep,
    user: CurrentUserDep,
) -> None:
    """Enfile la destruction de la stack de l'utilisateur (404 si absente/non possedee).

    La destruction est asynchrone : le worker detruit conteneurs et volumes
    (`docker compose down -v`) et passe la stack en `destroying` puis `destroyed`.
    Suivre le flux SSE `/stacks/{id}/events` pour la progression.
    """
    await DestroyStack(repository=repository, queue=queue).execute(stack_id, user.id)


@router.get(
    "/{stack_id}/events",
    summary="Flux SSE des events de cycle de vie d'une stack (stack + services)",
)
async def stream_events(
    stack_id: UUID,
    repository: RepositoryDep,
    subscriber: SubscriberDep,
    user: CurrentUserDep,
) -> StreamingResponse:
    """Stream SSE (`text/event-stream`) des events de la stack de l'utilisateur.

    Verifie d'abord l'appartenance (404 synchrone si absente/non possedee) AVANT
    d'ouvrir le flux, puis pousse chaque `StackEvent` du canal Redis (niveau stack
    et par service) tant que la connexion reste ouverte. Un keepalive maintient la
    connexion vivante pendant les phases silencieuses (pull d'images). Aucun
    secret ne transite par ce flux.
    """
    await GetStack(repository).execute(stack_id, user.id)

    async def event_stream() -> AsyncIterator[str]:
        async for frame in stack_sse_keepalive_stream(subscriber.subscribe(stack_id)):
            yield frame

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )


def _to_command(request: StackCreateRequest, owner_id: UUID) -> StackCreateCommand:
    """Traduit la requete HTTP + l'utilisateur authentifie en commande applicative."""
    return StackCreateCommand(
        owner_id=owner_id,
        name=request.name,
        services=tuple(_to_service_command(service) for service in request.services),
        links=tuple(_to_link_command(link) for link in request.links),
    )


def _to_service_command(service: StackServiceRequest) -> StackServiceCommand:
    return StackServiceCommand(
        template_id=service.template_id,
        version=service.version,
        alias=service.alias,
        order_index=service.order,
        params=dict(service.params),
    )


def _to_link_command(link: StackLinkRequest) -> StackLinkCommand:
    return StackLinkCommand(
        from_alias=link.from_alias,
        to_alias=link.to_alias,
        var_mappings=dict(link.var_mappings),
    )
