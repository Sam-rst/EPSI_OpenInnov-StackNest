"""Entite de domaine StackLink : lien dirige entre deux services d'une stack."""

from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class StackLink:
    """Lien dirige entre un service consommateur et un service fournisseur.

    Entite mutable identifiee par `id`. Modelise l'injection de variables
    d'environnement du fournisseur (`to_service_id`) vers le consommateur
    (`from_service_id`) : `var_mappings` associe un nom de variable a une
    expression resolue cote worker (ex. `DB_HOST` -> `{to.alias}`).

    Guard clause : un service ne peut pas se lier a lui-meme. L'absence de cycle
    dans le graphe global est validee applicativement (lot 2), pas a ce niveau.

    - `stack_id`        : stack proprietaire (FK, cascade en base).
    - `from_service_id` : service consommateur (qui recoit les variables).
    - `to_service_id`   : service fournisseur (dont on derive les variables).
    - `var_mappings`    : mapping `{ ENV_VAR : expression }` (JSON).
    """

    id: UUID
    stack_id: UUID
    from_service_id: UUID
    to_service_id: UUID
    var_mappings: dict[str, str] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.from_service_id == self.to_service_id:
            raise ValueError("StackLink.from_service_id et to_service_id doivent differer.")
