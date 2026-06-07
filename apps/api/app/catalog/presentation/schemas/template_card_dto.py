"""Schema DTO d'une carte de template (vue liste, allege)."""

from uuid import UUID

from pydantic import BaseModel, Field

from app.catalog.domain.enums.template_category import TemplateCategory


class TemplateCardDTO(BaseModel):
    """Representation legere d'un template pour la grille du catalogue.

    Miroir du modele `CatalogItem` cote front : ne porte ni versions ni
    parametres (charges seulement sur la vue detail).
    """

    id: UUID = Field(..., description="Identifiant unique du template.")
    slug: str = Field(..., description="Identifiant lisible et unique (URLs).")
    name: str = Field(..., description="Nom affiche du template.")
    icon: str = Field(..., description="Nom d'icone lucide (kebab-case).")
    category: TemplateCategory = Field(..., description="Categorie de la ressource.")
    provider: str = Field(..., description="Fournisseur d'execution (Docker, Terraform...).")
    tags: list[str] = Field(default_factory=list, description="Libelles de recherche.")
    description: str = Field(..., description="Description courte de la ressource.")
    popular: bool = Field(..., description="Mis en avant dans le catalogue.")
