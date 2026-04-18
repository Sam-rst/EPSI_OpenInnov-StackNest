"""Schema de reponse pour un sous-check de sante."""

from pydantic import BaseModel, Field

from app.health.domain.enums.check_status import CheckStatus


class CheckResponse(BaseModel):
    """Resultat d'un check de sante individuel (DB, Redis, SMTP, ...)."""

    name: str = Field(
        ...,
        description="Identifiant du sous-service (ex : `db`, `redis`, `smtp`).",
        examples=["db", "redis"],
    )
    status: CheckStatus = Field(
        ...,
        description="Statut du sous-service : `ok`, `down`, ou `timeout`.",
        examples=["ok"],
    )
    duration_ms: float = Field(
        ...,
        description="Duree du check en millisecondes.",
        examples=[12.5],
    )
    details: dict[str, str] = Field(
        default_factory=dict,
        description="Metadonnees optionnelles du check (ex : host, error message).",
    )
