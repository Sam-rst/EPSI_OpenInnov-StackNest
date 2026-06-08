"""Tests unitaires de l'entite Message (message persiste d'une conversation)."""

from uuid import uuid4

from app.chat.domain.entities.message import Message
from app.chat.domain.enums.message_role import MessageRole


def _message(**overrides: object) -> Message:
    params: dict[str, object] = {
        "id": uuid4(),
        "conversation_id": uuid4(),
        "role": MessageRole.USER,
        "content": "Deploie un postgres",
    }
    params.update(overrides)
    return Message(**params)  # type: ignore[arg-type]


class TestMessageValide:
    def test_construction_nominale(self) -> None:
        conversation_id = uuid4()
        message = _message(conversation_id=conversation_id, role=MessageRole.ASSISTANT)

        assert message.conversation_id == conversation_id
        assert message.role is MessageRole.ASSISTANT
        assert message.content == "Deploie un postgres"
        assert message.created_at is None

    def test_contenu_vide_autorise(self) -> None:
        # Un message assistant ne portant qu'un appel d'outil n'a pas de texte.
        message = _message(role=MessageRole.ASSISTANT, content="")

        assert message.content == ""
