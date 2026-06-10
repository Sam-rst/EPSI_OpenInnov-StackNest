"""Schema de reponse REST d'un deploiement (vue publique, sans secret)."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.value_objects.access_endpoint import AccessEndpoint
from app.deployment.domain.value_objects.template_provisioning import TemplateProvisioning

# Valeur de remplacement des parametres de type `secret` dans la reponse REST :
# la valeur reelle n'est jamais renvoyee (cf. retours QC securite).
_SECRET_MASK = "••••••••"


class DeploymentResponse(BaseModel):
    """Representation publique d'un deploiement renvoyee par l'API REST.

    Invariant de securite : ne porte JAMAIS de valeur sensible. Deux protections :

    - le secret genere (mot de passe du conteneur) ne transite que dans le flux
      SSE (event `running`), affiche une seule fois cote client (design section 8) ;
    - les parametres de type `secret` saisis par l'utilisateur sont **masques**
      ici (jamais renvoyes en clair), en s'appuyant sur le descripteur du template.

    `template_name` (resolu depuis le catalogue) permet a l'UI d'afficher un nom
    lisible plutot que l'UUID du template. L'`access_url` (`host:port`) n'est
    presente qu'une fois le port publie.
    """

    id: UUID = Field(..., description="Identifiant unique du deploiement.")
    template_id: UUID = Field(..., description="Template du catalogue provisionne.")
    template_name: str | None = Field(
        None, description="Nom lisible du template (resolu depuis le catalogue)."
    )
    template_version: str = Field(..., description="Version choisie du template.")
    name: str = Field(..., description="Nom du deploiement saisi par l'utilisateur.")
    status: DeploymentStatus = Field(..., description="Etat courant du cycle de vie.")
    params: dict[str, Any] = Field(
        default_factory=dict,
        description="Valeurs des parametres de provisioning (secrets masques).",
    )
    host: str | None = Field(None, description="Hote d'execution une fois provisionne.")
    published_port: int | None = Field(None, description="Port publie sur l'hote (run).")
    access_url: str | None = Field(
        None, description="Adresse d'acces `host:port` (une fois le port publie)."
    )
    connection_username: str | None = Field(
        None,
        description=(
            "Nom d'utilisateur de connexion par defaut de la ressource (ex. `postgres`). "
            "Derive du descripteur du template ; non sensible (le mot de passe, lui, ne "
            "transite que dans le flux SSE). `None` si le template n'a pas de compte par defaut."
        ),
    )
    created_at: datetime | None = Field(None, description="Date de creation.")
    updated_at: datetime | None = Field(None, description="Date de derniere mise a jour.")

    @classmethod
    def from_entity(
        cls,
        deployment: Deployment,
        provisioning: TemplateProvisioning | None = None,
    ) -> "DeploymentResponse":
        """Construit la reponse depuis l'entite, en masquant les params secret.

        `provisioning` (descripteur du template) est optionnel : quand il est
        fourni, il enrichit la reponse du `template_name` et masque les params
        declares `secret`. Quand il est absent (rare), la reponse reste valide
        mais sans nom de template et sans masquage cible (les valeurs sont alors
        renvoyees telles quelles — l'appelant doit fournir le descripteur des qu'il
        sert des params utilisateur).
        """
        return cls(
            id=deployment.id,
            template_id=deployment.template_id,
            template_name=provisioning.template_name if provisioning else None,
            template_version=deployment.template_version,
            name=deployment.name,
            status=deployment.status,
            params=cls._mask_secrets(dict(deployment.params), provisioning),
            host=deployment.host,
            published_port=deployment.published_port,
            access_url=cls._access_url(deployment),
            connection_username=provisioning.connection_username() if provisioning else None,
            created_at=deployment.created_at,
            updated_at=deployment.updated_at,
        )

    @staticmethod
    def _mask_secrets(
        params: dict[str, Any], provisioning: TemplateProvisioning | None
    ) -> dict[str, Any]:
        """Remplace par un masque la valeur des params declares `secret`."""
        if provisioning is None:
            return params
        secret_keys = provisioning.secret_param_keys()
        return {key: _SECRET_MASK if key in secret_keys else value for key, value in params.items()}

    @staticmethod
    def _access_url(deployment: Deployment) -> str | None:
        """Renvoie `host:port` si le port est publie, sinon None."""
        if deployment.host is None or deployment.published_port is None:
            return None
        return AccessEndpoint(host=deployment.host, port=deployment.published_port).url
