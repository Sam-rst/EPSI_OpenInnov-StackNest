"""Router des endpoints /health (agregation globale + dispatch par nom)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app.core.config import Settings, get_settings
from app.health.application.ports.health_check import HealthCheck
from app.health.application.use_cases.get_global_health import GetGlobalHealth
from app.health.domain.enums.check_status import CheckStatus
from app.health.domain.exceptions.health_check_not_found import (
    HealthCheckNotFoundException,
)
from app.health.presentation.dependencies.health_checks import get_health_checks
from app.health.presentation.schemas.responses.check_response import CheckResponse
from app.health.presentation.schemas.responses.health_response import HealthResponse

router = APIRouter(prefix="/health", tags=["Platform"])

SettingsDep = Annotated[Settings, Depends(get_settings)]
HealthChecksDep = Annotated[list[HealthCheck], Depends(get_health_checks)]


@router.get("", summary="Statut global agrege")
async def global_health(
    settings: SettingsDep,
    checks: HealthChecksDep,
    response: Response,
) -> HealthResponse:
    """Retourne le statut agrege de l'API et de tous ses sous-services.

    `status` vaut `ok` si tous les sous-checks enregistres sont OK (registre
    vide inclus), `down` des qu'au moins un check est DOWN ou TIMEOUT. Dans
    ce dernier cas, le code HTTP est **503 Service Unavailable** (conforme
    au comportement attendu par Nginx upstream check).

    Les metadonnees de build (`version`, `env`, `deployed_at`) sont
    dupliquees depuis `/version` pour que monitoring et Nginx n'aient
    qu'un seul call a faire.
    """
    global_result = await GetGlobalHealth(checks=checks).execute()

    if global_result.status is not CheckStatus.OK:
        response.status_code = 503

    return HealthResponse(
        status=global_result.status,
        version=settings.app_version,
        env=settings.app_env,
        deployed_at=settings.deployed_at,
        checks=[
            CheckResponse(
                name=c.name, status=c.status, duration_ms=c.duration_ms, details=c.details
            )
            for c in global_result.checks
        ],
    )


@router.get("/{check_name}", summary="Statut d'un sous-service specifique")
async def single_check(
    check_name: str,
    checks: HealthChecksDep,
    response: Response,
) -> CheckResponse:
    """Execute un check specifique par son nom. `404` si non enregistre.

    Renvoie le detail (`name`, `status`, `duration_ms`, `details`) du
    sous-service. Code HTTP **503** si le check est `down` ou `timeout`,
    **200** sinon.
    """
    target = next((c for c in checks if c.name == check_name), None)
    if target is None:
        raise HealthCheckNotFoundException(name=check_name)

    result = await target.check()

    if result.status is not CheckStatus.OK:
        response.status_code = 503

    return CheckResponse(
        name=result.name,
        status=result.status,
        duration_ms=result.duration_ms,
        details=result.details,
    )
