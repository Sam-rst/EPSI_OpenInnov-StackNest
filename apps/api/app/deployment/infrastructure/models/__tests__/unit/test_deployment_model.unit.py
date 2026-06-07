"""Tests unitaires du modele ORM `DeploymentModel` (mapping, sans base reelle)."""

from typing import cast

from sqlalchemy import Table

# Import a effet de bord : enregistre tous les modeles ORM sur Base.metadata
# afin que les FK `owner_id -> users` et `template_id -> templates` resolvent
# leurs tables cibles au moment de l'inspection.
import app.core.database.models_registry  # noqa: F401  # isort: skip
from app.deployment.infrastructure.models.deployment_model import DeploymentModel


class TestDeploymentModel:
    def test_table_deployments(self) -> None:
        assert DeploymentModel.__tablename__ == "deployments"

    def test_colonnes_attendues(self) -> None:
        colonnes = set(DeploymentModel.__table__.columns.keys())

        assert colonnes == {
            "id",
            "owner_id",
            "template_id",
            "template_version",
            "name",
            "status",
            "params",
            "host",
            "published_port",
            "created_at",
            "updated_at",
        }

    def test_id_est_clef_primaire(self) -> None:
        assert DeploymentModel.__table__.columns["id"].primary_key is True

    def test_colonnes_obligatoires_non_nullables(self) -> None:
        colonnes = DeploymentModel.__table__.columns

        assert colonnes["owner_id"].nullable is False
        assert colonnes["template_id"].nullable is False
        assert colonnes["template_version"].nullable is False
        assert colonnes["name"].nullable is False
        assert colonnes["status"].nullable is False
        assert colonnes["params"].nullable is False

    def test_colonnes_d_acces_sont_nullables(self) -> None:
        colonnes = DeploymentModel.__table__.columns

        assert colonnes["host"].nullable is True
        assert colonnes["published_port"].nullable is True

    def test_index_sur_owner_id(self) -> None:
        table = cast(Table, DeploymentModel.__table__)
        indexed_columns = {column.name for index in table.indexes for column in index.columns}

        assert "owner_id" in indexed_columns

    def test_fk_owner_vers_users(self) -> None:
        fk = next(iter(DeploymentModel.__table__.columns["owner_id"].foreign_keys))

        assert fk.column.table.name == "users"

    def test_fk_template_vers_templates(self) -> None:
        fk = next(iter(DeploymentModel.__table__.columns["template_id"].foreign_keys))

        assert fk.column.table.name == "templates"

    def test_status_type_enum_deployment_status(self) -> None:
        colonne_type = DeploymentModel.__table__.columns["status"].type

        assert getattr(colonne_type, "name", None) == "deployment_status"
