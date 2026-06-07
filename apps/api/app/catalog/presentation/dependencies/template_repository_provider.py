"""Provider FastAPI du depot de templates (adosse a la session de la requete)."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.domain.interfaces.template_repository import TemplateRepository
from app.catalog.infrastructure.repositories.sqlalchemy_template_repository import (
    SqlAlchemyTemplateRepository,
)
from app.core.database.request_session import get_request_session


def get_template_repository(
    session: Annotated[AsyncSession, Depends(get_request_session)],
) -> TemplateRepository:
    """Provider du depot de templates lie a la session de la requete.

    Surchargeable par les tests via `app.dependency_overrides` (faux depot en
    memoire), sans toucher a une vraie base.
    """
    return SqlAlchemyTemplateRepository(session)
