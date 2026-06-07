"""Schema DTO du detail riche d'un template (carte + versions + parametres)."""

from pydantic import Field

from app.catalog.presentation.schemas.template_card_dto import TemplateCardDTO
from app.catalog.presentation.schemas.template_param_dto import TemplateParamDTO
from app.catalog.presentation.schemas.template_version_dto import TemplateVersionDTO


class TemplateDetailDTO(TemplateCardDTO):
    """Detail complet d'un template : la carte enrichie de ses versions et params."""

    versions: list[TemplateVersionDTO] = Field(
        default_factory=list, description="Versions disponibles du template."
    )
    params: list[TemplateParamDTO] = Field(
        default_factory=list, description="Parametres de provisioning du template."
    )
