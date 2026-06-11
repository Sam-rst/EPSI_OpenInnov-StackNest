"""Schema de reponse REST d'une stack (vue publique, sans secret)."""

from collections.abc import Mapping, Set
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.stack.domain.entities.stack import Stack
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.value_objects.stack_detail import StackDetail
from app.stack.presentation.schemas.stack_link_response import StackLinkResponse
from app.stack.presentation.schemas.stack_service_response import StackServiceResponse


class StackResponse(BaseModel):
    """Representation publique d'une stack renvoyee par l'API REST.

    Sert deux vues : un resume (creation 201, liste) sans membres, et le detail
    (`GET /stacks/{id}`) enrichi de ses `services` et `links`. Invariant de
    securite : ne porte JAMAIS de secret — les params `secret` des services sont
    masques (`StackServiceResponse`), et les `var_mappings` des liens ne sont que
    des expressions resolues worker-side (lot 3).

    - `services` / `links` : vides pour le resume, peuples pour le detail.
    """

    id: UUID = Field(..., description="Identifiant unique de la stack.")
    owner_id: UUID = Field(..., description="Proprietaire de la stack.")
    name: str = Field(..., description="Nom de la stack saisi par l'utilisateur.")
    status: StackStatus = Field(..., description="Etat global courant (agregat des services).")
    services: list[StackServiceResponse] = Field(
        default_factory=list, description="Services de la stack (detail uniquement)."
    )
    links: list[StackLinkResponse] = Field(
        default_factory=list, description="Liens diriges entre services (detail uniquement)."
    )
    created_at: datetime | None = Field(None, description="Date de creation.")
    updated_at: datetime | None = Field(None, description="Date de derniere mise a jour.")

    @classmethod
    def from_stack(cls, stack: Stack) -> "StackResponse":
        """Construit la vue resume (sans services ni liens) — creation et liste."""
        return cls(
            id=stack.id,
            owner_id=stack.owner_id,
            name=stack.name,
            status=stack.status,
            created_at=stack.created_at,
            updated_at=stack.updated_at,
        )

    @classmethod
    def from_detail(
        cls,
        detail: StackDetail,
        secret_keys_by_service: Mapping[UUID, Set[str]] | None = None,
    ) -> "StackResponse":
        """Construit la vue detail (services masques + liens) — `GET /stacks/{id}`.

        `secret_keys_by_service` associe a chaque id de service les cles de ses
        params `secret` (resolues via le catalogue), pour masquer leur valeur.
        Absent : aucun masquage cible (l'appelant DOIT le fournir des qu'il sert
        des params utilisateur).
        """
        secret_keys = secret_keys_by_service or {}
        return cls(
            id=detail.stack.id,
            owner_id=detail.stack.owner_id,
            name=detail.stack.name,
            status=detail.stack.status,
            services=[
                StackServiceResponse.from_entity(service, secret_keys.get(service.id, frozenset()))
                for service in detail.services
            ],
            links=[StackLinkResponse.from_entity(link) for link in detail.links],
            created_at=detail.stack.created_at,
            updated_at=detail.stack.updated_at,
        )
