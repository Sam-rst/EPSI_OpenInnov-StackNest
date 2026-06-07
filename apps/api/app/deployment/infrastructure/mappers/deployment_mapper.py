"""Mapper de conversion entre l'entite `Deployment` et le modele ORM.

Isole le domaine de SQLAlchemy : le repository ne manipule que des entites
`Deployment`, le mapper se charge de la conversion bidirectionnelle avec le
modele `DeploymentModel`.
"""

from app.deployment.domain.entities.deployment import Deployment
from app.deployment.infrastructure.models.deployment_model import DeploymentModel


class DeploymentMapper:
    """Traduit entre le domaine (`Deployment`) et la persistance (`DeploymentModel`)."""

    @staticmethod
    def to_entity(model: DeploymentModel) -> Deployment:
        return Deployment(
            id=model.id,
            owner_id=model.owner_id,
            template_id=model.template_id,
            template_version=model.template_version,
            name=model.name,
            status=model.status,
            params=dict(model.params),
            host=model.host,
            published_port=model.published_port,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(entity: Deployment) -> DeploymentModel:
        # created_at / updated_at sont gardes cote base (server_default) : on ne
        # les transmet pas pour ne pas figer une valeur calculee a la creation.
        return DeploymentModel(
            id=entity.id,
            owner_id=entity.owner_id,
            template_id=entity.template_id,
            template_version=entity.template_version,
            name=entity.name,
            status=entity.status,
            params=dict(entity.params),
            host=entity.host,
            published_port=entity.published_port,
        )
