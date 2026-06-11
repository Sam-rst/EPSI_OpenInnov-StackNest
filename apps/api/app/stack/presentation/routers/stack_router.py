"""Router HTTP des stacks : CRUD owner (creation / liste / detail / suppression).

Toutes les routes sont protegees par `get_current_user` et isolees par
proprietaire : un utilisateur ne voit et n'agit que sur ses propres stacks (une
stack d'autrui renvoie 404, on ne divulgue pas son existence). Au lot 2, la
creation **persiste** la stack en `pending` sans lancer de provisioning (worker
au lot 3) et la suppression est purement en base. Aucun secret ne figure dans les
reponses : les params `secret` des services sont masques. Pas de flux SSE (lot 3).
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.auth.domain.entities.user import User
from app.auth.presentation.dependencies.current_user import get_current_user
from app.stack.application.commands.stack_create_command import StackCreateCommand
from app.stack.application.commands.stack_link_command import StackLinkCommand
from app.stack.application.commands.stack_service_command import StackServiceCommand
from app.stack.application.create_stack import CreateStack
from app.stack.application.delete_stack import DeleteStack
from app.stack.application.get_stack import GetStack
from app.stack.application.list_stacks import ListStacks
from app.stack.domain.interfaces.stack_repository import StackRepository
from app.stack.domain.interfaces.stack_template_reader import StackTemplateReader
from app.stack.presentation.dependencies.stack_providers import (
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

router = APIRouter(prefix="/stacks", tags=["Stack"])

CurrentUserDep = Annotated[User, Depends(get_current_user)]
RepositoryDep = Annotated[StackRepository, Depends(get_stack_repository)]
ReaderDep = Annotated[StackTemplateReader, Depends(get_stack_template_reader)]


@router.post(
    "",
    response_model=StackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Creer une stack (persiste, sans provisioning au lot 2)",
)
async def create_stack(
    request: StackCreateRequest,
    repository: RepositoryDep,
    reader: ReaderDep,
    user: CurrentUserDep,
) -> StackResponse:
    """Valide la composition puis persiste la stack `pending` (services + liens).

    Rejette (422) une composition invalide (alias dupliques, lien orphelin,
    cycle...) ou un service referencant un template/version inconnu ou non Docker.
    Aucun provisioning n'est lance ici : le worker `compose up` viendra au lot 3.
    """
    command = _to_command(request, user.id)
    stack = await CreateStack(repository=repository, reader=reader).execute(command)
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
    summary="Supprimer une stack possedee (cascade services + liens)",
)
async def delete_stack(
    stack_id: UUID,
    repository: RepositoryDep,
    user: CurrentUserDep,
) -> None:
    """Supprime la stack de l'utilisateur en base (404 si absente/non possedee).

    La destruction reelle des conteneurs et volumes (`compose down -v`) viendra au
    lot 3 (worker).
    """
    await DeleteStack(repository).execute(stack_id, user.id)


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
