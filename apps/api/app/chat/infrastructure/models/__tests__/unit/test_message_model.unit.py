"""Tests unitaires du modele ORM `MessageModel` (mapping, sans base reelle)."""

from typing import cast

from sqlalchemy import Table

import app.core.database.models_registry  # noqa: F401  # isort: skip
from app.chat.infrastructure.models.message_model import MessageModel


class TestMessageModel:
    def test_table_messages(self) -> None:
        assert MessageModel.__tablename__ == "messages"

    def test_colonnes_attendues(self) -> None:
        colonnes = set(MessageModel.__table__.columns.keys())

        assert colonnes == {"id", "conversation_id", "role", "content", "created_at"}

    def test_id_est_clef_primaire(self) -> None:
        assert MessageModel.__table__.columns["id"].primary_key is True

    def test_colonnes_obligatoires_non_nullables(self) -> None:
        colonnes = MessageModel.__table__.columns

        assert colonnes["conversation_id"].nullable is False
        assert colonnes["role"].nullable is False
        assert colonnes["content"].nullable is False

    def test_index_sur_conversation_id(self) -> None:
        table = cast(Table, MessageModel.__table__)
        indexed = {column.name for index in table.indexes for column in index.columns}

        assert "conversation_id" in indexed

    def test_fk_conversation_vers_conversations_avec_cascade(self) -> None:
        fk = next(iter(MessageModel.__table__.columns["conversation_id"].foreign_keys))

        assert fk.column.table.name == "conversations"
        # Suppression d'un fil -> ses messages partent en cascade (CRUD delete).
        assert fk.ondelete == "CASCADE"

    def test_role_type_enum_message_role(self) -> None:
        colonne_type = MessageModel.__table__.columns["role"].type

        assert getattr(colonne_type, "name", None) == "message_role"
