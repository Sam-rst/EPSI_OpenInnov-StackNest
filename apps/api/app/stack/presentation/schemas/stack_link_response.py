"""Schema de reponse REST d'un lien de stack (vue publique)."""

from uuid import UUID

from pydantic import BaseModel, Field

from app.stack.domain.entities.stack_link import StackLink


class StackLinkResponse(BaseModel):
    """Representation publique d'un lien dirige entre deux services d'une stack.

    Expose les ids des services consommateur / fournisseur et les `var_mappings`,
    qui sont des **expressions** (`{to.alias}`, `{to.secret}`...) resolues cote
    worker au provisioning (lot 3). Aucune valeur sensible n'y figure : seul le
    worker substitue le secret reel dans l'environnement du conteneur — jamais
    expose au REST ni au SSE (cf. design, section « Securite »).
    """

    id: UUID = Field(..., description="Identifiant du lien.")
    from_service_id: UUID = Field(..., description="Service consommateur (recoit les variables).")
    to_service_id: UUID = Field(..., description="Service fournisseur (source des variables).")
    var_mappings: dict[str, str] = Field(
        default_factory=dict,
        description="Mapping variable -> expression (resolu cote worker, sans secret).",
    )

    @classmethod
    def from_entity(cls, link: StackLink) -> "StackLinkResponse":
        """Construit la reponse depuis l'entite de lien."""
        return cls(
            id=link.id,
            from_service_id=link.from_service_id,
            to_service_id=link.to_service_id,
            var_mappings=dict(link.var_mappings),
        )
