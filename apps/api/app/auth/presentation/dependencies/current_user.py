"""Dependances FastAPI d'authentification : utilisateur courant + providers.

`get_current_user` decode le Bearer access token, charge l'utilisateur et
verifie que la version du jeton correspond a celle du compte (revocation). Les
providers `get_token_service` / `get_user_repository` sont surchargeables par
les tests via `app.dependency_overrides`.
"""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.exceptions.invalid_token import InvalidTokenException
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.infrastructure.repositories.sqlalchemy_user_repository import (
    SqlAlchemyUserRepository,
)
from app.auth.infrastructure.security.jwt_token_service import JwtTokenService
from app.core.config import Settings, get_settings
from app.core.database.request_session import get_request_session

# auto_error=False : on leve nous-memes une DomainException 401 (message FR,
# format de reponse homogene) plutot que la 403 par defaut de HTTPBearer.
_bearer_scheme = HTTPBearer(auto_error=False)


def get_token_service(settings: Annotated[Settings, Depends(get_settings)]) -> TokenService:
    """Provider du service de jetons (JWT signe avec le secret applicatif)."""
    return JwtTokenService(secret=settings.jwt_secret)


def get_user_repository(
    session: Annotated[AsyncSession, Depends(get_request_session)],
) -> UserRepository:
    """Provider du depot d'utilisateurs adosse a la session de la requete."""
    return SqlAlchemyUserRepository(session)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    token_service: Annotated[TokenService, Depends(get_token_service)],
    repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> User:
    """Authentifie la requete a partir du Bearer access token.

    Verifie la signature/expiration/finalite du jeton, charge l'utilisateur,
    puis controle que `token_version` du jeton correspond a celui du compte
    (un compte ayant incremente sa version invalide tous ses jetons emis avant).
    Leve une 401 (InvalidTokenException) dans tous les cas d'echec.
    """
    if credentials is None:
        raise InvalidTokenException("Jeton d'authentification manquant.")

    claims = token_service.decode(credentials.credentials, expected_purpose=TokenPurpose.ACCESS)
    user = await repository.get_by_id(claims.subject)
    if user is None or user.token_version != claims.token_version:
        raise InvalidTokenException("Jeton revoque ou utilisateur introuvable.")
    return user
