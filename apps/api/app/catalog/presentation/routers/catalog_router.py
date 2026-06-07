"""Router HTTP du catalogue : GET liste/detail (user) + CRUD (admin)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.auth.domain.entities.user import User
from app.auth.presentation.dependencies.current_user import get_current_user
from app.auth.presentation.dependencies.require_admin import require_admin
from app.catalog.application.create_template import CreateTemplate
from app.catalog.application.delete_template import DeleteTemplate
from app.catalog.application.get_template_detail import GetTemplateDetail
from app.catalog.application.list_templates import ListTemplates
from app.catalog.application.update_template import UpdateTemplate
from app.catalog.domain.interfaces.template_repository import TemplateRepository
from app.catalog.presentation.dependencies.template_repository_provider import (
    get_template_repository,
)
from app.catalog.presentation.schemas.template_card_dto import TemplateCardDTO
from app.catalog.presentation.schemas.template_detail_dto import TemplateDetailDTO
from app.catalog.presentation.schemas.template_dto_mapper import TemplateDTOMapper
from app.catalog.presentation.schemas.template_request_mapper import TemplateRequestMapper
from app.catalog.presentation.schemas.template_write_request import TemplateWriteRequest

router = APIRouter(prefix="/catalog", tags=["Catalogue"])

RepositoryDep = Annotated[TemplateRepository, Depends(get_template_repository)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]
AdminDep = Annotated[User, Depends(require_admin)]


@router.get(
    "/templates",
    response_model=list[TemplateCardDTO],
    summary="Liste des templates du catalogue (cartes legeres)",
)
async def list_templates(
    repository: RepositoryDep,
    _user: CurrentUserDep,
) -> list[TemplateCardDTO]:
    """Renvoie tous les templates en cartes legeres (filtrage assume cote client)."""
    templates = await ListTemplates(repository).execute()
    return [TemplateDTOMapper.to_card(template) for template in templates]


@router.get(
    "/templates/{template_id}",
    response_model=TemplateDetailDTO,
    summary="Detail d'un template (versions + parametres)",
)
async def get_template(
    template_id: UUID,
    repository: RepositoryDep,
    _user: CurrentUserDep,
) -> TemplateDetailDTO:
    """Renvoie le detail riche d'un template, ou 404 s'il est introuvable."""
    template = await GetTemplateDetail(repository).execute(template_id)
    return TemplateDTOMapper.to_detail(template)


@router.post(
    "/templates",
    response_model=TemplateDetailDTO,
    status_code=status.HTTP_201_CREATED,
    summary="Creer un template (administrateur)",
)
async def create_template(
    request: TemplateWriteRequest,
    repository: RepositoryDep,
    _admin: AdminDep,
) -> TemplateDetailDTO:
    """Cree un template a partir du corps complet (reserve aux admins)."""
    command = TemplateRequestMapper.to_command(request)
    template = await CreateTemplate(repository).execute(command)
    return TemplateDTOMapper.to_detail(template)


@router.put(
    "/templates/{template_id}",
    response_model=TemplateDetailDTO,
    summary="Mettre a jour un template (administrateur)",
)
async def update_template(
    template_id: UUID,
    request: TemplateWriteRequest,
    repository: RepositoryDep,
    _admin: AdminDep,
) -> TemplateDetailDTO:
    """Met a jour integralement un template (reserve aux admins)."""
    command = TemplateRequestMapper.to_command(request)
    template = await UpdateTemplate(repository).execute(template_id, command)
    return TemplateDTOMapper.to_detail(template)


@router.delete(
    "/templates/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un template (administrateur)",
)
async def delete_template(
    template_id: UUID,
    repository: RepositoryDep,
    _admin: AdminDep,
) -> None:
    """Supprime un template (cascade sur versions/params). Reserve aux admins."""
    await DeleteTemplate(repository).execute(template_id)
