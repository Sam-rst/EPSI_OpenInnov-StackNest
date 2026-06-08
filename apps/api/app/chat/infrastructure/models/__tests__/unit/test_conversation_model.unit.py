"""Tests unitaires du modele ORM `ConversationModel` (mapping, sans base reelle)."""

from typing import cast

from sqlalchemy import Table

# Import a effet de bord : enregistre tous les modeles ORM sur Base.metadata
# afin que la FK `owner_id -> users` resolve sa table cible a l'inspection.
import app.core.database.models_registry  # noqa: F401  # isort: skip
from app.chat.infrastructure.models.conversation_model import ConversationModel


class TestConversationModel:
    def test_table_conversations(self) -> None:
        assert ConversationModel.__tablename__ == "conversations"

    def test_colonnes_attendues(self) -> None:
        colonnes = set(ConversationModel.__table__.columns.keys())

        assert colonnes == {"id", "owner_id", "title", "created_at", "updated_at"}

    def test_id_est_clef_primaire(self) -> None:
        assert ConversationModel.__table__.columns["id"].primary_key is True

    def test_colonnes_obligatoires_non_nullables(self) -> None:
        colonnes = ConversationModel.__table__.columns

        assert colonnes["owner_id"].nullable is False
        assert colonnes["title"].nullable is False

    def test_index_sur_owner_id(self) -> None:
        table = cast(Table, ConversationModel.__table__)
        indexed = {column.name for index in table.indexes for column in index.columns}

        assert "owner_id" in indexed

    def test_fk_owner_vers_users(self) -> None:
        fk = next(iter(ConversationModel.__table__.columns["owner_id"].foreign_keys))

        assert fk.column.table.name == "users"
