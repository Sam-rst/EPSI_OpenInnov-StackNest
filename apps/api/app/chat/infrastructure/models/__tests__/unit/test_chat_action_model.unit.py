"""Tests unitaires du modele ORM `ChatActionModel` (mapping, sans base reelle)."""

import app.core.database.models_registry  # noqa: F401  # isort: skip
from app.chat.infrastructure.models.chat_action_model import ChatActionModel


class TestChatActionModel:
    def test_table_chat_actions(self) -> None:
        assert ChatActionModel.__tablename__ == "chat_actions"

    def test_colonnes_attendues(self) -> None:
        colonnes = set(ChatActionModel.__table__.columns.keys())

        assert colonnes == {
            "id",
            "conversation_id",
            "message_id",
            "kind",
            "args",
            "status",
            "deployment_id",
            "created_at",
        }

    def test_id_est_clef_primaire(self) -> None:
        assert ChatActionModel.__table__.columns["id"].primary_key is True

    def test_colonnes_obligatoires_non_nullables(self) -> None:
        colonnes = ChatActionModel.__table__.columns

        assert colonnes["conversation_id"].nullable is False
        assert colonnes["message_id"].nullable is False
        assert colonnes["kind"].nullable is False
        assert colonnes["status"].nullable is False
        assert colonnes["args"].nullable is False

    def test_deployment_id_nullable(self) -> None:
        assert ChatActionModel.__table__.columns["deployment_id"].nullable is True

    def test_fk_conversation_vers_conversations_avec_cascade(self) -> None:
        fk = next(iter(ChatActionModel.__table__.columns["conversation_id"].foreign_keys))

        assert fk.column.table.name == "conversations"
        assert fk.ondelete == "CASCADE"

    def test_fk_message_vers_messages_avec_cascade(self) -> None:
        fk = next(iter(ChatActionModel.__table__.columns["message_id"].foreign_keys))

        assert fk.column.table.name == "messages"
        assert fk.ondelete == "CASCADE"

    def test_fk_deployment_vers_deployments_sans_cascade(self) -> None:
        fk = next(iter(ChatActionModel.__table__.columns["deployment_id"].foreign_keys))

        assert fk.column.table.name == "deployments"
        # Pas de cascade : la trace de l'action survit a la suppression du
        # deploiement (la FK est mise a NULL).
        assert fk.ondelete == "SET NULL"

    def test_kind_type_enum_chat_action_kind(self) -> None:
        colonne_type = ChatActionModel.__table__.columns["kind"].type

        assert getattr(colonne_type, "name", None) == "chat_action_kind"

    def test_status_type_enum_chat_action_status(self) -> None:
        colonne_type = ChatActionModel.__table__.columns["status"].type

        assert getattr(colonne_type, "name", None) == "chat_action_status"
