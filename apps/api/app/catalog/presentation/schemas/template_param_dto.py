"""Schema DTO d'un parametre de template (vue detail)."""

from typing import Any

from pydantic import BaseModel, Field

from app.catalog.domain.enums.param_type import ParamType


class TemplateParamDTO(BaseModel):
    """Parametre de provisioning d'un template (exposee dans le detail)."""

    key: str = Field(..., description="Cle technique du parametre.")
    label: str = Field(..., description="Libelle affiche dans le formulaire.")
    type: ParamType = Field(..., description="Type pilotant le rendu du formulaire.")
    required: bool = Field(..., description="Parametre obligatoire.")
    default_value: str | None = Field(None, description="Valeur par defaut (texte), si definie.")
    options: dict[str, Any] | None = Field(
        None, description="Choix possibles pour un parametre de type SELECT."
    )
    order_index: int = Field(..., description="Ordre d'affichage dans le formulaire.")
