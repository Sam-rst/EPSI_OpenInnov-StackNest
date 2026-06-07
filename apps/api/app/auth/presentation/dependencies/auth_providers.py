"""Providers FastAPI cablant les adaptateurs concrets aux use cases auth.

Regroupe les fabriques de dependances (hasher, email sender, rate limiters,
use cases) consommees par le router `/auth`. Surchargeables par les tests via
`app.dependency_overrides` pour injecter des fakes (pas de Redis/SMTP reel en
unit/integ cible).
"""

from typing import Annotated

from fastapi import Depends

from app.auth.application.get_current_user import GetCurrentUser
from app.auth.application.login_user import LoginUser
from app.auth.application.logout_user import LogoutUser
from app.auth.application.refresh_access import RefreshAccess
from app.auth.application.register_user import RegisterUser
from app.auth.application.request_password_reset import RequestPasswordReset
from app.auth.application.reset_password import ResetPassword
from app.auth.application.verify_email import VerifyEmail
from app.auth.domain.interfaces.password_hasher import PasswordHasher
from app.auth.domain.interfaces.rate_limiter import RateLimiter
from app.auth.domain.interfaces.token_service import TokenService
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.infrastructure.email.smtp_email_sender_factory import build_smtp_email_sender
from app.auth.infrastructure.email.smtp_settings import SmtpSettings, get_smtp_settings
from app.auth.infrastructure.ratelimit.redis_rate_limiter import RedisRateLimiter
from app.auth.infrastructure.security.bcrypt_password_hasher import BcryptPasswordHasher
from app.auth.presentation.dependencies.current_user import (
    get_token_service,
    get_user_repository,
)
from app.core.config import Settings, get_settings
from app.core.redis.redis_client import get_redis_client
from app.email.domain.interfaces.email_sender import EmailSender

# --- Adaptateurs d'infrastructure ---


def get_password_hasher() -> PasswordHasher:
    """Provider du hacheur de mots de passe (bcrypt cost >= 12)."""
    return BcryptPasswordHasher()


def get_email_sender(
    smtp_settings: Annotated[SmtpSettings, Depends(get_smtp_settings)],
) -> EmailSender:
    """Provider de l'envoyeur d'emails SMTP (MailHog en dev)."""
    return build_smtp_email_sender(smtp_settings)


def get_rate_limiter(
    settings: Annotated[Settings, Depends(get_settings)],
) -> RateLimiter:
    """Provider du limiteur de debit Redis (login/register/forgot)."""
    return RedisRateLimiter(
        get_redis_client(),
        max_attempts=settings.auth_rate_limit_max,
        window_seconds=settings.auth_rate_limit_window_seconds,
    )


# --- Use cases ---


def get_register_user(
    repository: Annotated[UserRepository, Depends(get_user_repository)],
    hasher: Annotated[PasswordHasher, Depends(get_password_hasher)],
    token_service: Annotated[TokenService, Depends(get_token_service)],
    email_sender: Annotated[EmailSender, Depends(get_email_sender)],
    smtp_settings: Annotated[SmtpSettings, Depends(get_smtp_settings)],
) -> RegisterUser:
    return RegisterUser(
        repository=repository,
        hasher=hasher,
        token_service=token_service,
        email_sender=email_sender,
        verify_token_ttl_seconds=smtp_settings.auth_verify_token_ttl_seconds,
        verify_url_base=smtp_settings.auth_verify_url_base,
    )


def get_verify_email(
    repository: Annotated[UserRepository, Depends(get_user_repository)],
    token_service: Annotated[TokenService, Depends(get_token_service)],
) -> VerifyEmail:
    return VerifyEmail(repository=repository, token_service=token_service)


def get_login_user(
    repository: Annotated[UserRepository, Depends(get_user_repository)],
    hasher: Annotated[PasswordHasher, Depends(get_password_hasher)],
    token_service: Annotated[TokenService, Depends(get_token_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> LoginUser:
    return LoginUser(
        repository=repository,
        hasher=hasher,
        token_service=token_service,
        require_email_verification=settings.auth_require_email_verification,
        access_token_ttl_seconds=settings.jwt_access_ttl_seconds,
        refresh_token_ttl_seconds=settings.jwt_refresh_ttl_seconds,
    )


def get_refresh_access(
    repository: Annotated[UserRepository, Depends(get_user_repository)],
    token_service: Annotated[TokenService, Depends(get_token_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> RefreshAccess:
    return RefreshAccess(
        repository=repository,
        token_service=token_service,
        access_token_ttl_seconds=settings.jwt_access_ttl_seconds,
        refresh_token_ttl_seconds=settings.jwt_refresh_ttl_seconds,
    )


def get_logout_user(
    repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> LogoutUser:
    return LogoutUser(repository=repository)


def get_request_password_reset(
    repository: Annotated[UserRepository, Depends(get_user_repository)],
    token_service: Annotated[TokenService, Depends(get_token_service)],
    email_sender: Annotated[EmailSender, Depends(get_email_sender)],
    smtp_settings: Annotated[SmtpSettings, Depends(get_smtp_settings)],
) -> RequestPasswordReset:
    return RequestPasswordReset(
        repository=repository,
        token_service=token_service,
        email_sender=email_sender,
        reset_token_ttl_seconds=smtp_settings.auth_reset_token_ttl_seconds,
        reset_url_base=smtp_settings.auth_reset_url_base,
    )


def get_reset_password(
    repository: Annotated[UserRepository, Depends(get_user_repository)],
    hasher: Annotated[PasswordHasher, Depends(get_password_hasher)],
    token_service: Annotated[TokenService, Depends(get_token_service)],
) -> ResetPassword:
    return ResetPassword(repository=repository, hasher=hasher, token_service=token_service)


def get_get_current_user(
    repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> GetCurrentUser:
    return GetCurrentUser(repository=repository)
