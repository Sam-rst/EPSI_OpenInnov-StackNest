"""Commande applicative : un service a ajouter dans une stack a creer."""

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID


@dataclass(frozen=True)
class StackServiceCommand:
    """Descriptif d'un service membre de la stack a creer (DTO applicatif).

    Sous-commande de `StackCreateCommand`, immutable et sans logique. La couche
    presentation traduit chaque entree du tableau `services[]` de la requete HTTP
    en cet objet ; le use case `CreateStack` en derive une entite `StackService`.

    - `template_id` : template du catalogue dont derive l'image du service.
    - `version`     : libelle de version choisi (ex. `16`) -> image `repo:16`.
    - `alias`       : nom unique du service dans la stack (cle compose, DNS interne).
    - `params`      : valeurs des parametres de provisioning (JSON).
    - `order_index` : ordre d'ajout / d'affichage du service dans la stack.
    """

    template_id: UUID
    version: str
    alias: str
    order_index: int
    params: dict[str, Any] = field(default_factory=dict)
