"""Schema de reponse REST d'un deploiement (vue publique, sans secret)."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.value_objects.access_endpoint import AccessEndpoint


class DeploymentResponse(BaseModel):
    """Representation publique d'un deploiement renvoyee par l'API REST.

    Invariant de securite : ne porte JAMAIS le secret du deploiement. Le mot de
    passe genere ne transite que dans le flux SSE (event `running`), affiche une
    seule fois cote client (cf. design section 8). L'`access_url` (`host:port`)
    n'est presente qu'une fois le port publie.
    """

    id: UUID = Field(..., description="Identifiant unique du deploiement.")
    template_id: UUID = Field(..., description="Template du catalogue provisionne.")
    template_version: str = Field(..., description="Version choisie du template.")
    name: str = Field(..., description="Nom du deploiement saisi par l'utilisateur.")
    status: DeploymentStatus = Field(..., description="Etat courant du cycle de vie.")
    params: dict[str, Any] = Field(
        default_factory=dict, description="Valeurs des parametres de provisioning."
    )
    host: str | None = Field(None, description="Hote d'execution une fois provisionne.")
    published_port: int | None = Field(None, description="Port publie sur l'hote (run).")
    access_url: str | None = Field(
        None, description="Adresse d'acces `host:port` (une fois le port publie)."
    )
    created_at: datetime | None = Field(None, description="Date de creation.")
    updated_at: datetime | None = Field(None, description="Date de derniere mise a jour.")

    @classmethod
    def from_entity(cls, deployment: Deployment) -> "DeploymentResponse":
        """Construit la reponse a partir de l'entite de domaine (sans secret)."""
        return cls(
            id=deployment.id,
            template_id=deployment.template_id,
            template_version=deployment.template_version,
            name=deployment.name,
            status=deployment.status,
            params=dict(deployment.params),
            host=deployment.host,
            published_port=deployment.published_port,
            access_url=cls._access_url(deployment),
            created_at=deployment.created_at,
            updated_at=deployment.updated_at,
        )

    @staticmethod
    def _access_url(deployment: Deployment) -> str | None:
        """Renvoie `host:port` si le port est publie, sinon None."""
        if deployment.host is None or deployment.published_port is None:
            return None
        return AccessEndpoint(host=deployment.host, port=deployment.published_port).url
