"""Implementation SQLAlchemy du depot de templates du catalogue."""

from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.domain.entities.template import Template
from app.catalog.domain.interfaces.template_repository import TemplateRepository
from app.catalog.domain.value_objects.slug import Slug
from app.catalog.infrastructure.mappers.template_mapper import TemplateMapper
from app.catalog.infrastructure.models.template_model import TemplateModel
from app.catalog.infrastructure.models.template_param_model import TemplateParamModel
from app.catalog.infrastructure.models.template_version_model import TemplateVersionModel


class SqlAlchemyTemplateRepository(TemplateRepository):
    """Depot de templates adosse a une `AsyncSession` SQLAlchemy.

    Le repository ne commit pas : la transaction est geree par l'appelant (unit
    of work par requete). Les modeles socle n'exposant pas de relations ORM, les
    versions et parametres sont charges par requetes explicites et l'agregat est
    reconstruit par le mapper. La mise a jour remplace integralement les enfants
    (suppression puis reinsertion), cohérent avec une edition complete du
    formulaire admin.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[Template]:
        result = await self._session.execute(select(TemplateModel).order_by(TemplateModel.name))
        return [TemplateMapper.to_entity(model) for model in result.scalars().all()]

    async def get_by_id(self, template_id: UUID) -> Template | None:
        model = await self._session.get(TemplateModel, template_id)
        if model is None:
            return None
        return await self._load_aggregate(model)

    async def get_by_slug(self, slug: Slug) -> Template | None:
        result = await self._session.execute(
            select(TemplateModel).where(TemplateModel.slug == slug.value)
        )
        model = result.scalar_one_or_none()
        if model is None:
            return None
        return await self._load_aggregate(model)

    async def add(self, template: Template) -> Template:
        model = TemplateMapper.to_model(template)
        self._session.add(model)
        await self._session.flush()
        await self._insert_children(template)
        await self._session.flush()
        await self._session.refresh(model)
        return await self._load_aggregate(model)

    async def update(self, template: Template) -> Template:
        model = await self._session.get(TemplateModel, template.id)
        if model is None:
            model = TemplateMapper.to_model(template)
            self._session.add(model)
            await self._session.flush()
        else:
            self._apply_scalar_fields(model, template)
        await self._delete_children(template.id)
        await self._insert_children(template)
        await self._session.flush()
        await self._session.refresh(model)
        return await self._load_aggregate(model)

    async def delete(self, template_id: UUID) -> None:
        await self._session.execute(delete(TemplateModel).where(TemplateModel.id == template_id))
        await self._session.flush()

    async def _load_aggregate(self, model: TemplateModel) -> Template:
        versions = await self._session.execute(
            select(TemplateVersionModel)
            .where(TemplateVersionModel.template_id == model.id)
            .order_by(TemplateVersionModel.is_default.desc(), TemplateVersionModel.version)
        )
        params = await self._session.execute(
            select(TemplateParamModel)
            .where(TemplateParamModel.template_id == model.id)
            .order_by(TemplateParamModel.order_index)
        )
        return TemplateMapper.to_entity(
            model,
            versions=list(versions.scalars().all()),
            params=list(params.scalars().all()),
        )

    async def _insert_children(self, template: Template) -> None:
        for version in template.versions:
            self._session.add(TemplateMapper.version_to_model(version, template_id=template.id))
        for param in template.params:
            self._session.add(TemplateMapper.param_to_model(param, template_id=template.id))

    async def _delete_children(self, template_id: UUID) -> None:
        await self._session.execute(
            delete(TemplateVersionModel).where(TemplateVersionModel.template_id == template_id)
        )
        await self._session.execute(
            delete(TemplateParamModel).where(TemplateParamModel.template_id == template_id)
        )

    @staticmethod
    def _apply_scalar_fields(model: TemplateModel, template: Template) -> None:
        model.slug = template.slug.value
        model.name = template.name
        model.icon = template.icon
        model.category = template.category
        model.provider = template.provider
        model.description = template.description
        model.popular = template.popular
        model.tags = list(template.tags)
        model.is_active = template.is_active
