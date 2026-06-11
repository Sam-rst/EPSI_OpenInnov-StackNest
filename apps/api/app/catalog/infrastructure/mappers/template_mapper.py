"""Mapper de conversion entre les entites du catalogue et les modeles ORM.

Isole le domaine de SQLAlchemy : le repository ne manipule que des entites
(`Template` + ses `TemplateVersion`/`TemplateParam`), le mapper se charge de la
conversion bidirectionnelle avec les modeles (`TemplateModel`,
`TemplateVersionModel`, `TemplateParamModel`).
"""

from uuid import UUID

from app.catalog.domain.entities.template import Template
from app.catalog.domain.entities.template_param import TemplateParam
from app.catalog.domain.entities.template_version import TemplateVersion
from app.catalog.domain.value_objects.slug import Slug
from app.catalog.infrastructure.models.template_model import TemplateModel
from app.catalog.infrastructure.models.template_param_model import TemplateParamModel
from app.catalog.infrastructure.models.template_version_model import TemplateVersionModel


class TemplateMapper:
    """Traduit entre le domaine (Template + agregats) et la persistance (modeles)."""

    @staticmethod
    def to_entity(
        model: TemplateModel,
        *,
        versions: list[TemplateVersionModel] | None = None,
        params: list[TemplateParamModel] | None = None,
    ) -> Template:
        return Template(
            id=model.id,
            slug=Slug(model.slug),
            name=model.name,
            icon=model.icon,
            category=model.category,
            provider=model.provider,
            description=model.description,
            popular=model.popular,
            tags=list(model.tags),
            is_active=model.is_active,
            engine=model.engine,
            versions=[TemplateMapper._version_to_entity(v) for v in versions or []],
            params=[TemplateMapper._param_to_entity(p) for p in params or []],
            image_repository=model.image_repository,
            internal_port=model.internal_port,
            secret_env=model.secret_env,
            command=list(model.command) if model.command is not None else None,
            secret_value_template=model.secret_value_template,
            is_deployable=model.is_deployable,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(entity: Template) -> TemplateModel:
        return TemplateModel(
            id=entity.id,
            slug=entity.slug.value,
            name=entity.name,
            icon=entity.icon,
            category=entity.category,
            provider=entity.provider,
            description=entity.description,
            popular=entity.popular,
            tags=list(entity.tags),
            is_active=entity.is_active,
            engine=entity.engine,
            image_repository=entity.image_repository,
            internal_port=entity.internal_port,
            secret_env=entity.secret_env,
            command=list(entity.command) if entity.command is not None else None,
            secret_value_template=entity.secret_value_template,
            is_deployable=entity.is_deployable,
        )

    @staticmethod
    def version_to_model(entity: TemplateVersion, *, template_id: UUID) -> TemplateVersionModel:
        return TemplateVersionModel(
            id=entity.id,
            template_id=template_id,
            version=entity.version,
            is_default=entity.is_default,
            is_lts=entity.is_lts,
            eol_date=entity.eol_date,
        )

    @staticmethod
    def param_to_model(entity: TemplateParam, *, template_id: UUID) -> TemplateParamModel:
        return TemplateParamModel(
            id=entity.id,
            template_id=template_id,
            key=entity.key,
            label=entity.label,
            type=entity.type,
            required=entity.required,
            default_value=entity.default_value,
            options=entity.options,
            order_index=entity.order_index,
            env_var=entity.env_var,
        )

    @staticmethod
    def _version_to_entity(model: TemplateVersionModel) -> TemplateVersion:
        return TemplateVersion(
            id=model.id,
            version=model.version,
            is_default=model.is_default,
            is_lts=model.is_lts,
            eol_date=model.eol_date,
        )

    @staticmethod
    def _param_to_entity(model: TemplateParamModel) -> TemplateParam:
        return TemplateParam(
            id=model.id,
            key=model.key,
            label=model.label,
            type=model.type,
            required=model.required,
            default_value=model.default_value,
            options=model.options,
            order_index=model.order_index,
            env_var=model.env_var,
        )
