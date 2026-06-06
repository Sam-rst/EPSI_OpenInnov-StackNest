"""Tests unitaires du registre de modeles ORM.

Verifie qu'importer le registre enregistre bien toutes les tables metier sur
`Base.metadata` — condition necessaire pour qu'Alembic autogenerate les voie.
"""

from app.core.database import models_registry  # noqa: F401 - import a effet de bord
from app.core.database.base import Base


class TestModelsRegistry:
    def test_enregistre_toutes_les_tables_metier(self) -> None:
        tables = set(Base.metadata.tables.keys())

        assert {"users", "templates", "template_versions", "template_params"} <= tables
