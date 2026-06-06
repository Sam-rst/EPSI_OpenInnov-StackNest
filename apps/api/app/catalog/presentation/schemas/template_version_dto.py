"""Schema DTO d'une version de template (vue detail)."""

from datetime import date

from pydantic import BaseModel, Field


class TemplateVersionDTO(BaseModel):
    """Version provisionnable d'un template (exposee dans le detail)."""

    version: str = Field(..., description="Libelle de la version.")
    is_default: bool = Field(..., description="Version proposee par defaut.")
    is_lts: bool = Field(..., description="Version a support long terme (LTS).")
    eol_date: date | None = Field(None, description="Date de fin de vie (EOL), si connue.")
