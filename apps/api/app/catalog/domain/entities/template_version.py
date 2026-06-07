"""Entite de domaine TemplateVersion : version disponible d'un template."""

from dataclasses import dataclass
from datetime import date
from uuid import UUID


@dataclass
class TemplateVersion:
    """Version provisionnable d'un template du catalogue.

    Entite identifiee par `id`, rattachee a un template parent (agregat). La
    guard clause garantit qu'une version porte toujours un libelle non vide.

    - `is_default` : version proposee par defaut au provisioning.
    - `is_lts`     : version a support long terme (Long Term Support).
    - `eol_date`   : date de fin de vie (End Of Life), nullable.
    """

    id: UUID
    version: str
    is_default: bool
    is_lts: bool
    eol_date: date | None

    def __post_init__(self) -> None:
        if not self.version.strip():
            raise ValueError("TemplateVersion.version ne doit pas etre vide.")
