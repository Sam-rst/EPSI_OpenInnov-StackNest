"""Tests unitaires de l'entite Conversation (fil de discussion d'un utilisateur)."""

from datetime import UTC, datetime
from uuid import uuid4

import pytest

from app.chat.domain.entities.conversation import Conversation


def _conversation(**overrides: object) -> Conversation:
    params: dict[str, object] = {
        "id": uuid4(),
        "owner_id": uuid4(),
        "title": "Deploiement Postgres",
    }
    params.update(overrides)
    return Conversation(**params)  # type: ignore[arg-type]


class TestConversationValide:
    def test_construction_nominale(self) -> None:
        owner_id = uuid4()
        conversation = _conversation(owner_id=owner_id, title="Mes tests")

        assert conversation.owner_id == owner_id
        assert conversation.title == "Mes tests"
        assert conversation.created_at is None
        assert conversation.updated_at is None

    def test_timestamps_optionnels_renseignes(self) -> None:
        now = datetime.now(UTC)
        conversation = _conversation(created_at=now, updated_at=now)

        assert conversation.created_at == now
        assert conversation.updated_at == now


class TestConversationGuards:
    def test_titre_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _conversation(title="   ")
