"""Schema de reponse de l'endpoint GET /health."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Reponse de la liveness probe. `status` vaut toujours "ok" quand l'API repond."""

    status: str = Field(
        ...,
        description="Statut de disponibilite. Toujours 'ok' si le serveur repond. "
        "Utilise par Kubernetes / Docker pour la liveness probe.",
        examples=["ok"],
    )
