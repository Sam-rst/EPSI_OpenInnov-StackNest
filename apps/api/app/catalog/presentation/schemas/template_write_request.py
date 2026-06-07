"""Schemas de requete d'ecriture d'un template (create + update admin).

Le meme corps complet sert pour POST (creation) et PUT (mise a jour) : l'admin
envoie l'integralite du template (champs + versions + parametres). La couche
presentation traduit ensuite ce schema en `TemplateCommand` applicative.
"""

from datetime import date
from typing import Any

from pydantic import BaseModel, Field

from app.catalog.domain.enums.param_type import ParamType
from app.catalog.domain.enums.template_category import TemplateCategory


class VersionWriteRequest(BaseModel):
    """Version a creer/mettre a jour sur un template."""

    version: str = Field(..., min_length=1, max_length=60)
    is_default: bool = False
    is_lts: bool = False
    eol_date: date | None = None


class ParamWriteRequest(BaseModel):
    """Parametre a creer/mettre a jour sur un template."""

    key: str = Field(..., min_length=1, max_length=120)
    label: str = Field(..., min_length=1, max_length=255)
    type: ParamType
    required: bool = False
    default_value: str | None = None
    options: dict[str, Any] | None = None
    order_index: int = Field(0, ge=0)


class TemplateWriteRequest(BaseModel):
    """Corps complet de creation/mise a jour d'un template (reserve aux admins)."""

    slug: str = Field(..., min_length=1, max_length=120)
    name: str = Field(..., min_length=1, max_length=120)
    icon: str = Field(..., min_length=1, max_length=120)
    category: TemplateCategory
    provider: str = Field(..., min_length=1, max_length=120)
    description: str = Field(..., min_length=1)
    popular: bool = False
    tags: list[str] = Field(default_factory=list)
    is_active: bool = True
    versions: list[VersionWriteRequest] = Field(default_factory=list)
    params: list[ParamWriteRequest] = Field(default_factory=list)
