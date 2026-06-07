"""Entite de domaine Template : fiche d'une ressource provisionnable (agregat)."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from app.catalog.domain.entities.template_param import TemplateParam
from app.catalog.domain.entities.template_version import TemplateVersion
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.domain.value_objects.slug import Slug


@dataclass
class Template:
    """Ressource provisionnable du catalogue (racine d'agregat).

    Entite identifiee par `id`, qui porte ses `versions` et `params` (agregat).
    Les guard clauses garantissent les invariants d'affichage : libelles non
    vides. Le `slug` est un value object garantissant le format de l'identifiant
    public.

    - `popular`   : mis en avant dans le catalogue.
    - `is_active` : masque un template sans le supprimer (defaut true).
    - `versions`  : versions disponibles (vide a la creation).
    - `params`    : parametres de provisioning (vide a la creation).
    """

    id: UUID
    slug: Slug
    name: str
    icon: str
    category: TemplateCategory
    provider: str
    description: str
    popular: bool = False
    tags: list[str] = field(default_factory=list)
    is_active: bool = True
    versions: list[TemplateVersion] = field(default_factory=list)
    params: list[TemplateParam] = field(default_factory=list)
    created_at: datetime | None = field(default=None)
    updated_at: datetime | None = field(default=None)

    def __post_init__(self) -> None:
        if not self.name.strip():
            raise ValueError("Template.name ne doit pas etre vide.")
        if not self.icon.strip():
            raise ValueError("Template.icon ne doit pas etre vide.")
        if not self.provider.strip():
            raise ValueError("Template.provider ne doit pas etre vide.")
        if not self.description.strip():
            raise ValueError("Template.description ne doit pas etre vide.")
