"""Implementation SQLAlchemy du depot de deploiements."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository
from app.deployment.infrastructure.mappers.deployment_mapper import DeploymentMapper
from app.deployment.infrastructure.models.deployment_model import DeploymentModel


class SqlAlchemyDeploymentRepository(DeploymentRepository):
    """Depot de deploiements adosse a une `AsyncSession` SQLAlchemy.

    Le repository ne commit pas : la transaction est geree par l'appelant (unit
    of work par requete). Les acces sont isoles par proprietaire via
    `list_by_owner` (cf. design section 8).
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, deployment: Deployment) -> Deployment:
        model = DeploymentMapper.to_model(deployment)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return DeploymentMapper.to_entity(model)

    async def get_by_id(self, deployment_id: UUID) -> Deployment | None:
        model = await self._session.get(DeploymentModel, deployment_id)
        if model is None:
            return None
        return DeploymentMapper.to_entity(model)

    async def list_by_owner(self, owner_id: UUID) -> list[Deployment]:
        result = await self._session.execute(
            select(DeploymentModel)
            .where(DeploymentModel.owner_id == owner_id)
            .order_by(DeploymentModel.created_at)
        )
        return [DeploymentMapper.to_entity(model) for model in result.scalars().all()]

    async def update(self, deployment: Deployment) -> Deployment:
        model = await self._session.get(DeploymentModel, deployment.id)
        if model is None:
            model = DeploymentMapper.to_model(deployment)
            self._session.add(model)
        else:
            self._apply_mutable_fields(model, deployment)
        await self._session.flush()
        await self._session.refresh(model)
        return DeploymentMapper.to_entity(model)

    @staticmethod
    def _apply_mutable_fields(model: DeploymentModel, deployment: Deployment) -> None:
        model.template_version = deployment.template_version
        model.name = deployment.name
        model.status = deployment.status
        model.params = dict(deployment.params)
        model.host = deployment.host
        model.published_port = deployment.published_port
