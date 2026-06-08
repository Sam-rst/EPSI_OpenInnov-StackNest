"""Schema de requete de creation d'un deploiement (corps du POST /deployments)."""

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class DeploymentCreateRequest(BaseModel):
    """Corps de creation d'un deploiement saisi par l'utilisateur authentifie.

    La couche presentation traduit ce schema en `CreateDeploymentCommand` en y
    injectant l'`owner_id` issu du jeton (jamais fourni par le client). Le secret
    n'est pas saisi ici : il est genere par le worker au provisioning.

    - `template_id` : template du catalogue a provisionner.
    - `version`     : libelle de version choisi (ex. `16`).
    - `name`        : libelle du deploiement saisi par l'utilisateur.
    - `params`      : valeurs des parametres de provisioning (JSON).
    """

    template_id: UUID = Field(..., description="Identifiant du template a provisionner.")
    version: str = Field(
        ..., min_length=1, max_length=60, description="Version choisie du template."
    )
    name: str = Field(..., min_length=1, max_length=120, description="Nom du deploiement.")
    params: dict[str, Any] = Field(
        default_factory=dict, description="Valeurs des parametres de provisioning."
    )
