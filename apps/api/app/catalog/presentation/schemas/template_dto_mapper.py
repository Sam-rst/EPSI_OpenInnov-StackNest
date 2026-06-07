"""Traduction des entites de domaine en DTO de presentation (lecture)."""

from app.catalog.domain.entities.template import Template
from app.catalog.presentation.schemas.template_card_dto import TemplateCardDTO
from app.catalog.presentation.schemas.template_detail_dto import TemplateDetailDTO
from app.catalog.presentation.schemas.template_param_dto import TemplateParamDTO
from app.catalog.presentation.schemas.template_version_dto import TemplateVersionDTO


class TemplateDTOMapper:
    """Construit les DTO de reponse a partir des entites du domaine."""

    @staticmethod
    def to_card(template: Template) -> TemplateCardDTO:
        return TemplateCardDTO(
            id=template.id,
            slug=template.slug.value,
            name=template.name,
            icon=template.icon,
            category=template.category,
            provider=template.provider,
            engine=template.engine,
            tags=list(template.tags),
            description=template.description,
            popular=template.popular,
        )

    @staticmethod
    def to_detail(template: Template) -> TemplateDetailDTO:
        return TemplateDetailDTO(
            id=template.id,
            slug=template.slug.value,
            name=template.name,
            icon=template.icon,
            category=template.category,
            provider=template.provider,
            engine=template.engine,
            tags=list(template.tags),
            description=template.description,
            popular=template.popular,
            image_repository=template.image_repository,
            internal_port=template.internal_port,
            secret_env=template.secret_env,
            versions=[
                TemplateVersionDTO(
                    version=version.version,
                    is_default=version.is_default,
                    is_lts=version.is_lts,
                    eol_date=version.eol_date,
                )
                for version in template.versions
            ],
            params=[
                TemplateParamDTO(
                    key=param.key,
                    label=param.label,
                    type=param.type,
                    required=param.required,
                    default_value=param.default_value,
                    options=param.options,
                    order_index=param.order_index,
                )
                for param in template.params
            ],
        )
