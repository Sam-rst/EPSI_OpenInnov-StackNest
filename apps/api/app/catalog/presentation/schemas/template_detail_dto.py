"""Schema DTO du detail riche d'un template (carte + versions + parametres)."""

from pydantic import Field

from app.catalog.presentation.schemas.template_card_dto import TemplateCardDTO
from app.catalog.presentation.schemas.template_param_dto import TemplateParamDTO
from app.catalog.presentation.schemas.template_version_dto import TemplateVersionDTO


class TemplateDetailDTO(TemplateCardDTO):
    """Detail complet d'un template : la carte enrichie de ses versions et params.

    Porte aussi le descripteur de provisioning (image/port/secret) utilise par la
    feature deploiement pour construire un conteneur Docker. Absent de la carte
    legere `TemplateCardDTO` : ce sont des metadonnees d'execution, pas
    d'affichage.
    """

    versions: list[TemplateVersionDTO] = Field(
        default_factory=list, description="Versions disponibles du template."
    )
    params: list[TemplateParamDTO] = Field(
        default_factory=list, description="Parametres de provisioning du template."
    )
    image_repository: str | None = Field(
        None, description="Depot de l'image Docker (image effective : repository:version)."
    )
    internal_port: int | None = Field(
        None, description="Port ecoute dans le conteneur (ex. 5432)."
    )
    secret_env: str | None = Field(
        None,
        description="Nom de la variable d'env recevant le mot de passe genere (null si aucun).",
    )
