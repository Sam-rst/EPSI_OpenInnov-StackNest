"""Composition root du slice stack : providers FastAPI des dependances.

Construit les implementations concretes des ports du domaine a partir de la
session DB de la requete (unit of work par requete, comme le catalogue et le
deploiement) :

- `StackRepository` est adosse a la session de la requete ;
- `StackTemplateReader` lit le catalogue via son repository (verification des
  templates a l'ajout + cles des params secret pour le masquage).

Tous les providers sont surchargeables par les tests via `app.dependency_overrides`
(faux en memoire), sans base reelle.
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.infrastructure.repositories.sqlalchemy_template_repository import (
    SqlAlchemyTemplateRepository,
)
from app.core.database.request_session import get_request_session
from app.stack.domain.interfaces.stack_repository import StackRepository
from app.stack.domain.interfaces.stack_template_reader import StackTemplateReader
from app.stack.infrastructure.reader.catalog_stack_template_reader import (
    CatalogStackTemplateReader,
)
from app.stack.infrastructure.repositories.sqlalchemy_stack_repository import (
    SqlAlchemyStackRepository,
)


def get_stack_repository(
    session: Annotated[AsyncSession, Depends(get_request_session)],
) -> StackRepository:
    """Provider du depot de stacks adosse a la session de la requete."""
    return SqlAlchemyStackRepository(session)


def get_stack_template_reader(
    session: Annotated[AsyncSession, Depends(get_request_session)],
) -> StackTemplateReader:
    """Provider du reader catalogue (gate d'ajout + cles secret) par requete."""
    return CatalogStackTemplateReader(SqlAlchemyTemplateRepository(session))
