"""Schemas de requete de creation d'une stack (corps du POST /stacks)."""

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class StackServiceRequest(BaseModel):
    """Un service a composer dans la stack (entree du tableau `services[]`).

    - `template_id` : template du catalogue dont derive l'image du service.
    - `version`     : libelle de version choisi (ex. `16`) -> image `repo:16`.
    - `alias`       : nom unique du service dans la stack (cle compose, DNS interne).
    - `params`      : valeurs des parametres de provisioning (JSON).
    - `order`       : ordre d'ajout / d'affichage du service dans la stack.
    """

    template_id: UUID = Field(..., description="Template du catalogue a provisionner.")
    version: str = Field(..., min_length=1, max_length=60, description="Version choisie.")
    alias: str = Field(
        ..., min_length=1, max_length=60, description="Alias unique du service (cle compose)."
    )
    params: dict[str, Any] = Field(
        default_factory=dict, description="Valeurs des parametres de provisioning."
    )
    order: int = Field(0, ge=0, description="Ordre d'affichage / d'ajout dans la stack.")


class StackLinkRequest(BaseModel):
    """Un lien dirige entre deux services de la stack (entree du tableau `links[]`).

    Exprime par les alias (lisibles), pas par les ids techniques : le use case
    resout les alias en ids une fois les services persistes.

    - `from_alias`   : alias du service consommateur (qui recoit les variables).
    - `to_alias`     : alias du service fournisseur (dont on derive les variables).
    - `var_mappings` : mapping `{ ENV_VAR : expression }` (resolu cote worker).
    """

    from_alias: str = Field(..., min_length=1, max_length=60, description="Alias consommateur.")
    to_alias: str = Field(..., min_length=1, max_length=60, description="Alias fournisseur.")
    var_mappings: dict[str, str] = Field(
        default_factory=dict, description="Mapping variable -> expression (resolu cote worker)."
    )


class StackCreateRequest(BaseModel):
    """Corps de creation d'une stack saisi par l'utilisateur authentifie.

    La couche presentation traduit ce schema en `StackCreateCommand` en y injectant
    l'`owner_id` issu du jeton (jamais fourni par le client). Aucun secret n'est
    saisi ici : les secrets seront generes par le worker au provisioning (lot 3).

    - `name`     : libelle de la stack.
    - `services` : services a composer (>= 1).
    - `links`    : liens diriges entre services (optionnels).
    """

    name: str = Field(..., min_length=1, max_length=120, description="Nom de la stack.")
    services: list[StackServiceRequest] = Field(
        ..., min_length=1, description="Services a composer (au moins un)."
    )
    links: list[StackLinkRequest] = Field(
        default_factory=list, description="Liens diriges entre services."
    )
