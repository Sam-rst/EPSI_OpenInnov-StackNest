"""Schema de reponse REST d'un service de stack (vue publique, secrets masques)."""

from collections.abc import Set
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.enums.service_status import ServiceStatus

# Valeur de remplacement des parametres de type `secret` dans la reponse REST :
# la valeur reelle n'est jamais renvoyee (meme logique que `DeploymentResponse`).
_SECRET_MASK = "••••••••"


class StackServiceResponse(BaseModel):
    """Representation publique d'un service membre d'une stack.

    Invariant de securite : ne porte JAMAIS de valeur sensible. Les parametres de
    type `secret` (declares par le template au catalogue) sont **masques** ici,
    comme dans `DeploymentResponse`. Le secret genere worker-side (lot 3) ne
    transitera, lui, que par le flux SSE — jamais par cette reponse REST.

    - `published_port` / `container_ref` : alloues au run (None avant le lot 3).
    """

    id: UUID = Field(..., description="Identifiant du service dans la stack.")
    template_id: UUID = Field(..., description="Template du catalogue dont derive l'image.")
    version: str = Field(..., description="Version choisie du template.")
    alias: str = Field(..., description="Alias unique du service (cle compose, DNS interne).")
    service_status: ServiceStatus = Field(..., description="Etat courant du service.")
    order_index: int = Field(..., description="Ordre d'affichage / d'ajout dans la stack.")
    params: dict[str, Any] = Field(
        default_factory=dict,
        description="Valeurs des parametres de provisioning (secrets masques).",
    )
    published_port: int | None = Field(None, description="Port publie sur l'hote (run, lot 3).")
    container_ref: str | None = Field(None, description="Reference du conteneur (run, lot 3).")

    @classmethod
    def from_entity(
        cls, service: StackService, secret_keys: Set[str] = frozenset()
    ) -> "StackServiceResponse":
        """Construit la reponse depuis l'entite en masquant les params secret.

        `secret_keys` (cles des parametres declares `secret` par le template du
        catalogue) est fourni par l'appelant (resolu via le port de lecture du
        catalogue). Vide par defaut : sans descripteur, aucune valeur n'est
        masquee — l'appelant DOIT fournir les cles des qu'il sert des params.
        """
        return cls(
            id=service.id,
            template_id=service.template_id,
            version=service.version,
            alias=service.alias,
            service_status=service.service_status,
            order_index=service.order_index,
            params=cls._mask_secrets(dict(service.params), secret_keys),
            published_port=service.published_port,
            container_ref=service.container_ref,
        )

    @staticmethod
    def _mask_secrets(params: dict[str, Any], secret_keys: Set[str]) -> dict[str, Any]:
        """Remplace par un masque la valeur des params declares `secret`."""
        return {key: _SECRET_MASK if key in secret_keys else value for key, value in params.items()}
