"""Tests unitaires du `DeploymentMapper` (conversion entite <-> modele)."""

from datetime import UTC, datetime
from uuid import uuid4

from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.infrastructure.mappers.deployment_mapper import DeploymentMapper
from app.deployment.infrastructure.models.deployment_model import DeploymentModel


def _entity(
    *,
    status: DeploymentStatus = DeploymentStatus.PENDING,
    host: str | None = None,
    published_port: int | None = None,
) -> Deployment:
    return Deployment(
        id=uuid4(),
        owner_id=uuid4(),
        template_id=uuid4(),
        template_version="16",
        name="ma-base-postgres",
        status=status,
        params={"db_name": "app", "size": "small"},
        host=host,
        published_port=published_port,
    )


class TestToModel:
    def test_copie_les_champs_scalaires(self) -> None:
        entity = _entity(status=DeploymentStatus.RUNNING, host="node-1", published_port=54320)

        model = DeploymentMapper.to_model(entity)

        assert model.id == entity.id
        assert model.owner_id == entity.owner_id
        assert model.template_id == entity.template_id
        assert model.template_version == "16"
        assert model.name == "ma-base-postgres"
        assert model.status is DeploymentStatus.RUNNING
        assert model.params == {"db_name": "app", "size": "small"}
        assert model.host == "node-1"
        assert model.published_port == 54320

    def test_n_impose_pas_les_timestamps(self) -> None:
        # created_at / updated_at sont geres cote base (server_default) : le
        # mapper ne doit pas les renseigner cote Python (sinon il figerait une
        # valeur a la creation). On verifie qu'ils ne sont pas dans l'etat de
        # l'instance ORM avant tout flush.
        model = DeploymentMapper.to_model(_entity())

        assert "created_at" not in model.__dict__
        assert "updated_at" not in model.__dict__


class TestToEntity:
    def test_reconstruit_l_entite(self) -> None:
        created = datetime(2026, 6, 7, 12, 0, tzinfo=UTC)
        owner_id = uuid4()
        template_id = uuid4()
        deployment_id = uuid4()
        model = DeploymentModel(
            id=deployment_id,
            owner_id=owner_id,
            template_id=template_id,
            template_version="15",
            name="cache-redis",
            status=DeploymentStatus.STOPPED,
            params={"max_memory": "256mb"},
            host="node-2",
            published_port=63790,
            created_at=created,
            updated_at=created,
        )

        entity = DeploymentMapper.to_entity(model)

        assert entity.id == deployment_id
        assert entity.owner_id == owner_id
        assert entity.template_id == template_id
        assert entity.template_version == "15"
        assert entity.name == "cache-redis"
        assert entity.status is DeploymentStatus.STOPPED
        assert entity.params == {"max_memory": "256mb"}
        assert entity.host == "node-2"
        assert entity.published_port == 63790
        assert entity.created_at == created
        assert entity.updated_at == created

    def test_aller_retour_preserve_les_valeurs(self) -> None:
        entity = _entity(status=DeploymentStatus.PROVISIONING)

        round_trip = DeploymentMapper.to_entity(DeploymentMapper.to_model(entity))

        assert round_trip.id == entity.id
        assert round_trip.owner_id == entity.owner_id
        assert round_trip.template_id == entity.template_id
        assert round_trip.template_version == entity.template_version
        assert round_trip.name == entity.name
        assert round_trip.status == entity.status
        assert round_trip.params == entity.params
        assert round_trip.host == entity.host
        assert round_trip.published_port == entity.published_port
