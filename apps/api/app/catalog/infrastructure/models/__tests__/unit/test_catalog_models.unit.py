"""Tests unitaires des modeles ORM du catalogue (mapping, sans base reelle)."""

from typing import cast

from sqlalchemy import Table

from app.catalog.infrastructure.models.template_model import TemplateModel
from app.catalog.infrastructure.models.template_param_model import TemplateParamModel
from app.catalog.infrastructure.models.template_version_model import TemplateVersionModel


class TestTemplateModel:
    def test_table_templates(self) -> None:
        assert TemplateModel.__tablename__ == "templates"

    def test_colonnes_attendues(self) -> None:
        colonnes = set(TemplateModel.__table__.columns.keys())

        assert colonnes == {
            "id",
            "slug",
            "name",
            "icon",
            "category",
            "provider",
            "description",
            "popular",
            "tags",
            "is_active",
            "engine",
            "image_repository",
            "internal_port",
            "secret_env",
            "created_at",
            "updated_at",
        }

    def test_slug_unique(self) -> None:
        assert TemplateModel.__table__.columns["slug"].unique is True

    def test_is_active_defaut_true(self) -> None:
        assert TemplateModel.__table__.columns["is_active"].server_default is not None

    def test_engine_non_nullable_avec_defaut_docker(self) -> None:
        colonne = TemplateModel.__table__.columns["engine"]

        assert colonne.nullable is False
        assert colonne.server_default is not None
        assert str(colonne.server_default.arg) == "'docker'"

    def test_colonnes_du_descripteur_de_provisioning_sont_nullables(self) -> None:
        colonnes = TemplateModel.__table__.columns

        assert colonnes["image_repository"].nullable is True
        assert colonnes["internal_port"].nullable is True
        assert colonnes["secret_env"].nullable is True


class TestTemplateVersionModel:
    def test_table_template_versions(self) -> None:
        assert TemplateVersionModel.__tablename__ == "template_versions"

    def test_fk_vers_templates_avec_cascade(self) -> None:
        fk = next(iter(TemplateVersionModel.__table__.columns["template_id"].foreign_keys))

        assert fk.column.table.name == "templates"
        assert fk.ondelete == "CASCADE"

    def test_index_sur_template_id(self) -> None:
        table = cast(Table, TemplateVersionModel.__table__)
        indexed_columns = {column.name for index in table.indexes for column in index.columns}

        assert "template_id" in indexed_columns


class TestTemplateParamModel:
    def test_table_template_params(self) -> None:
        assert TemplateParamModel.__tablename__ == "template_params"

    def test_fk_vers_templates_avec_cascade(self) -> None:
        fk = next(iter(TemplateParamModel.__table__.columns["template_id"].foreign_keys))

        assert fk.column.table.name == "templates"
        assert fk.ondelete == "CASCADE"

    def test_colonnes_attendues(self) -> None:
        colonnes = set(TemplateParamModel.__table__.columns.keys())

        assert colonnes == {
            "id",
            "template_id",
            "key",
            "label",
            "type",
            "required",
            "default_value",
            "options",
            "order_index",
        }
