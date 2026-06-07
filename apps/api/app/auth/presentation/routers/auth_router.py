"""Router FastAPI d'authentification : `/auth/*`.

Endpoints : register, verify, login, refresh, logout, me, forgot, reset.
Le rate-limit (Redis) protege register/login/forgot. Le refresh token voyage
dans un cookie httpOnly/Secure/SameSite=Strict ; l'access token dans le body.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status

from app.auth.application.get_current_user import GetCurrentUser
from app.auth.application.login_user import LoginUser
from app.auth.application.logout_user import LogoutUser
from app.auth.application.refresh_access import RefreshAccess
from app.auth.application.register_user import RegisterUser
from app.auth.application.request_password_reset import RequestPasswordReset
from app.auth.application.reset_password import ResetPassword
from app.auth.application.verify_email import VerifyEmail
from app.auth.domain.entities.user import User
from app.auth.domain.exceptions.invalid_token import InvalidTokenException
from app.auth.presentation.dependencies.auth_providers import (
    get_get_current_user,
    get_login_user,
    get_logout_user,
    get_refresh_access,
    get_register_user,
    get_request_password_reset,
    get_reset_password,
    get_verify_email,
)
from app.auth.presentation.dependencies.current_user import get_current_user
from app.auth.presentation.dependencies.rate_limit import rate_limit
from app.auth.presentation.routers.refresh_cookie import (
    clear_refresh_cookie,
    set_refresh_cookie,
)
from app.auth.presentation.schemas.requests.forgot_request import ForgotRequest
from app.auth.presentation.schemas.requests.login_request import LoginRequest
from app.auth.presentation.schemas.requests.register_request import RegisterRequest
from app.auth.presentation.schemas.requests.reset_request import ResetRequest
from app.auth.presentation.schemas.requests.verify_request import VerifyRequest
from app.auth.presentation.schemas.responses.access_token_response import AccessTokenResponse
from app.auth.presentation.schemas.responses.auth_response import AuthResponse
from app.auth.presentation.schemas.responses.user_response import UserResponse
from app.core.config import Settings, get_settings

router = APIRouter(prefix="/auth", tags=["Auth"])

SettingsDep = Annotated[Settings, Depends(get_settings)]


@router.post(
    "/register",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Inscription (envoie un email de verification)",
    dependencies=[Depends(rate_limit("register"))],
)
async def register(
    payload: RegisterRequest,
    use_case: Annotated[RegisterUser, Depends(get_register_user)],
) -> None:
    """Cree un compte non verifie et envoie un email de verification.

    Reponse generique (202) quel que soit l'etat de l'email (anti-enumeration).
    """
    await use_case.execute(email=payload.email, password=payload.password)


@router.post(
    "/verify",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Verifie une adresse email via le token recu",
)
async def verify(
    payload: VerifyRequest,
    use_case: Annotated[VerifyEmail, Depends(get_verify_email)],
) -> None:
    """Active le compte associe au token de finalite `verify` (idempotent)."""
    await use_case.execute(token=payload.token)


@router.post(
    "/login",
    summary="Connexion (renvoie un access token + cookie refresh)",
    dependencies=[Depends(rate_limit("login"))],
)
async def login(
    payload: LoginRequest,
    response: Response,
    use_case: Annotated[LoginUser, Depends(get_login_user)],
    settings: SettingsDep,
) -> AuthResponse:
    """Authentifie l'utilisateur, pose le cookie refresh et renvoie l'access token."""
    result = await use_case.execute(email=payload.email, password=payload.password)
    set_refresh_cookie(response, token=result.refresh_token, settings=settings)
    return AuthResponse(
        access_token=result.access_token,
        user=UserResponse.from_entity(result.user),
    )


@router.post(
    "/refresh",
    summary="Rafraichit l'access token a partir du cookie refresh",
)
async def refresh(
    request: Request,
    response: Response,
    use_case: Annotated[RefreshAccess, Depends(get_refresh_access)],
    settings: SettingsDep,
) -> AccessTokenResponse:
    """Verifie le refresh token (cookie), re-emet une paire et fait tourner le cookie."""
    refresh_token = request.cookies.get(settings.refresh_cookie_name)
    if refresh_token is None:
        raise InvalidTokenException("Cookie de rafraichissement manquant.")
    result = await use_case.execute(refresh_token=refresh_token)
    set_refresh_cookie(response, token=result.refresh_token, settings=settings)
    return AccessTokenResponse(access_token=result.access_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deconnexion (invalide les refresh tokens)",
)
async def logout(
    response: Response,
    current_user: Annotated[User, Depends(get_current_user)],
    use_case: Annotated[LogoutUser, Depends(get_logout_user)],
    settings: SettingsDep,
) -> None:
    """Bump la `token_version` (invalide tous les refresh) et efface le cookie."""
    await use_case.execute(user_id=current_user.id)
    clear_refresh_cookie(response, settings=settings)


@router.get(
    "/me",
    summary="Profil de l'utilisateur authentifie",
)
async def me(
    current_user: Annotated[User, Depends(get_current_user)],
    use_case: Annotated[GetCurrentUser, Depends(get_get_current_user)],
) -> UserResponse:
    """Renvoie le profil a jour de l'utilisateur porteur de l'access token."""
    user = await use_case.execute(user_id=current_user.id)
    return UserResponse.from_entity(user)


@router.post(
    "/forgot",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Demande de reinitialisation de mot de passe",
    dependencies=[Depends(rate_limit("forgot"))],
)
async def forgot(
    payload: ForgotRequest,
    use_case: Annotated[RequestPasswordReset, Depends(get_request_password_reset)],
) -> None:
    """Envoie un email de reset si le compte existe (reponse generique 202)."""
    await use_case.execute(email=payload.email)


@router.post(
    "/reset",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Reinitialise le mot de passe via le token recu",
)
async def reset(
    payload: ResetRequest,
    use_case: Annotated[ResetPassword, Depends(get_reset_password)],
) -> None:
    """Change le mot de passe et invalide les sessions (bump token_version)."""
    await use_case.execute(token=payload.token, new_password=payload.password)
