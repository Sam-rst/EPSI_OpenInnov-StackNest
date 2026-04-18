"""Schema de reponse pour l'endpoint GET /health (status agrege)."""

from pydantic import BaseModel, Field

from app.health.domain.enums.check_status import CheckStatus
from app.health.presentation.schemas.responses.check_response import CheckResponse


class HealthResponse(BaseModel):
    """Statut agrege de l'API plus metadonnees de build.

    - `status` vaut `ok` si tous les sous-checks sont OK, `down` sinon.
    - `checks` liste le detail de chaque sous-service enregistre
      (vide tant qu'aucun `HealthCheck` n'est branche).
    - Les champs `version`, `env`, `deployed_at` dupliquent ceux de
      `/version` pour que monitoring et Nginx n'aient qu'un seul call.
    """

    status: CheckStatus = Field(
        ...,
        description="Statut global agrege.",
        examples=["ok"],
    )
    version: str = Field(
        ...,
        description="Version applicative (SemVer). Injectee au build par la CI.",
        examples=["0.1.0-rc.1"],
    )
    env: str = Field(
        ...,
        description="Environnement d'execution.",
        examples=["dev", "test", "preview", "prod"],
    )
    deployed_at: str = Field(
        ...,
        description="Timestamp ISO 8601 UTC du deploiement.",
        examples=["2026-04-18T12:00:00Z"],
    )
    checks: list[CheckResponse] = Field(
        default_factory=list,
        description="Detail de chaque sous-check enregistre. Vide si aucun check branche.",
    )
