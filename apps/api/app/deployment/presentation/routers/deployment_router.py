"""Router HTTP des deploiements : CRUD owner + actions de cycle de vie + SSE.

Toutes les routes sont protegees par `get_current_user` et isolees par
proprietaire : un utilisateur ne voit et n'agit que sur ses propres deploiements
(un deploiement d'autrui renvoie 404, on ne divulgue pas son existence). Les
actions de cycle de vie sont asynchrones (202 Accepted + job enfile vers le
worker). Le flux d'events est expose en SSE (`text/event-stream`) : c'est le seul
canal ou le secret transite, sur l'event `running`, diffuse une seule fois.
"""

from collections.abc import AsyncIterator
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse

from app.auth.domain.entities.user import User
from app.auth.presentation.dependencies.current_user import get_current_user
from app.deployment.application.commands.create_deployment_command import (
    CreateDeploymentCommand,
)
from app.deployment.application.create_deployment import CreateDeployment
from app.deployment.application.destroy_deployment import DestroyDeployment
from app.deployment.application.get_deployment import GetDeployment
from app.deployment.application.list_deployments import ListDeployments
from app.deployment.application.regenerate_password import RegeneratePassword
from app.deployment.application.start_deployment import StartDeployment
from app.deployment.application.stop_deployment import StopDeployment
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository
from app.deployment.domain.interfaces.event_subscriber import EventSubscriber
from app.deployment.domain.interfaces.job_queue import JobQueue
from app.deployment.domain.interfaces.template_provisioning_reader import (
    TemplateProvisioningReader,
)
from app.deployment.presentation.dependencies.deployment_providers import (
    get_deployment_repository,
    get_event_subscriber,
    get_job_queue,
    get_template_provisioning_reader,
)
from app.deployment.presentation.routers.provisioning_resolver import ProvisioningResolver
from app.deployment.presentation.schemas.deployment_create_request import (
    DeploymentCreateRequest,
)
from app.deployment.presentation.schemas.deployment_event_sse import (
    format_deployment_event_sse,
)
from app.deployment.presentation.schemas.deployment_response import DeploymentResponse

router = APIRouter(prefix="/deployments", tags=["Deploiement"])

CurrentUserDep = Annotated[User, Depends(get_current_user)]
RepositoryDep = Annotated[DeploymentRepository, Depends(get_deployment_repository)]
QueueDep = Annotated[JobQueue, Depends(get_job_queue)]
ReaderDep = Annotated[TemplateProvisioningReader, Depends(get_template_provisioning_reader)]
SubscriberDep = Annotated[EventSubscriber, Depends(get_event_subscriber)]

# En-tetes SSE : flux non bufferise et connexion maintenue ouverte. `X-Accel-
# Buffering: no` desactive le buffering Nginx (reverse-proxy) pour que chaque
# event parte immediatement vers le client.
_SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


@router.post(
    "",
    response_model=DeploymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Creer un deploiement (lance le provisioning)",
)
async def create_deployment(
    request: DeploymentCreateRequest,
    repository: RepositoryDep,
    queue: QueueDep,
    reader: ReaderDep,
    user: CurrentUserDep,
) -> DeploymentResponse:
    """Cree un deploiement `pending` puis enfile son provisioning asynchrone.

    Le template doit exister (sinon 404) et utiliser le moteur Docker (sinon 409,
    Terraform a venir). Le secret n'est pas dans la reponse : il sera diffuse via
    le flux SSE une fois le conteneur lance.
    """
    command = CreateDeploymentCommand(
        owner_id=user.id,
        template_id=request.template_id,
        template_version=request.version,
        name=request.name,
        params=request.params,
    )
    deployment = await CreateDeployment(repository=repository, queue=queue, reader=reader).execute(
        command
    )
    provisioning = await reader.get(deployment.template_id, deployment.template_version)
    return DeploymentResponse.from_entity(deployment, provisioning)


@router.get(
    "",
    response_model=list[DeploymentResponse],
    summary="Liste des deploiements de l'utilisateur",
)
async def list_deployments(
    repository: RepositoryDep,
    reader: ReaderDep,
    user: CurrentUserDep,
) -> list[DeploymentResponse]:
    """Renvoie les deploiements de l'utilisateur (template_name + secrets masques)."""
    deployments = await ListDeployments(repository).execute(user.id)
    resolver = ProvisioningResolver(reader)
    return [
        DeploymentResponse.from_entity(
            deployment,
            await resolver.resolve(deployment.template_id, deployment.template_version),
        )
        for deployment in deployments
    ]


@router.get(
    "/{deployment_id}",
    response_model=DeploymentResponse,
    summary="Detail d'un deploiement possede",
)
async def get_deployment(
    deployment_id: UUID,
    repository: RepositoryDep,
    reader: ReaderDep,
    user: CurrentUserDep,
) -> DeploymentResponse:
    """Renvoie le detail d'un deploiement de l'utilisateur, ou 404."""
    deployment = await GetDeployment(repository).execute(deployment_id, user.id)
    provisioning = await reader.get(deployment.template_id, deployment.template_version)
    return DeploymentResponse.from_entity(deployment, provisioning)


@router.post(
    "/{deployment_id}/stop",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Arreter un deploiement (asynchrone)",
)
async def stop_deployment(
    deployment_id: UUID,
    repository: RepositoryDep,
    queue: QueueDep,
    user: CurrentUserDep,
) -> None:
    """Enfile l'arret du deploiement (404 si absent/non possede, 409 si illegal)."""
    await StopDeployment(repository=repository, queue=queue).execute(deployment_id, user.id)


@router.post(
    "/{deployment_id}/start",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Redemarrer un deploiement (asynchrone)",
)
async def start_deployment(
    deployment_id: UUID,
    repository: RepositoryDep,
    queue: QueueDep,
    user: CurrentUserDep,
) -> None:
    """Enfile le redemarrage du deploiement (404 si absent/non possede, 409 si illegal)."""
    await StartDeployment(repository=repository, queue=queue).execute(deployment_id, user.id)


@router.post(
    "/{deployment_id}/destroy",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Detruire un deploiement (asynchrone)",
)
async def destroy_deployment(
    deployment_id: UUID,
    repository: RepositoryDep,
    queue: QueueDep,
    user: CurrentUserDep,
) -> None:
    """Enfile la destruction du deploiement (404 si absent/non possede, 409 si illegal)."""
    await DestroyDeployment(repository=repository, queue=queue).execute(deployment_id, user.id)


@router.post(
    "/{deployment_id}/regenerate-password",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Regenerer le mot de passe d'un deploiement (asynchrone)",
)
async def regenerate_password(
    deployment_id: UUID,
    repository: RepositoryDep,
    queue: QueueDep,
    user: CurrentUserDep,
) -> None:
    """Enfile la regeneration du secret (404 si absent/non possede, 409 si etat invalide)."""
    await RegeneratePassword(repository=repository, queue=queue).execute(deployment_id, user.id)


@router.get(
    "/{deployment_id}/events",
    summary="Flux SSE des events de cycle de vie d'un deploiement",
)
async def stream_events(
    deployment_id: UUID,
    repository: RepositoryDep,
    subscriber: SubscriberDep,
    user: CurrentUserDep,
) -> StreamingResponse:
    """Stream SSE (`text/event-stream`) des events du deploiement de l'utilisateur.

    Verifie d'abord l'appartenance (404 synchrone si absent/non possede) AVANT
    d'ouvrir le flux, puis pousse chaque `DeploymentEvent` du canal Redis tant que
    la connexion reste ouverte. L'event `running` transporte `access_url` + le
    secret (affiche une seule fois cote client).
    """
    await GetDeployment(repository).execute(deployment_id, user.id)

    async def event_stream() -> AsyncIterator[str]:
        async for event in subscriber.subscribe(deployment_id):
            yield format_deployment_event_sse(event)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )
