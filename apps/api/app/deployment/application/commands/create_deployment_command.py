"""Commande applicative de creation d'un deploiement."""

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID


@dataclass(frozen=True)
class CreateDeploymentCommand:
    """Donnees d'entree du use case `CreateDeployment` (DTO applicatif).

    Decouple la presentation (router/schema) du use case : la couche
    presentation traduira la requete HTTP + l'utilisateur authentifie en cette
    commande. Immutable, sans logique.

    - `owner_id`         : utilisateur authentifie proprietaire du deploiement.
    - `template_id`      : template du catalogue a provisionner.
    - `template_version` : libelle de version choisi (ex. `16`).
    - `name`             : libelle saisi par l'utilisateur.
    - `params`           : valeurs des parametres de provisioning (JSON).
    """

    owner_id: UUID
    template_id: UUID
    template_version: str
    name: str
    params: dict[str, Any] = field(default_factory=dict)
