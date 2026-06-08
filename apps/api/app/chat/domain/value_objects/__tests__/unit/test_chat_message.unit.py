"""Tests unitaires du value object ChatMessage (message transmis au LLM)."""

import pytest

from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.value_objects.chat_message import ChatMessage


class TestChatMessageValide:
    def test_construction_nominale(self) -> None:
        message = ChatMessage(role=MessageRole.USER, content="Deploie un postgres")

        assert message.role is MessageRole.USER
        assert message.content == "Deploie un postgres"

    def test_contenu_vide_autorise_pour_assistant(self) -> None:
        # Un message assistant peut etre vide quand il porte uniquement un appel
        # d'outil (le contenu textuel arrive en streaming ensuite).
        message = ChatMessage(role=MessageRole.ASSISTANT, content="")

        assert message.content == ""

    def test_est_immutable(self) -> None:
        message = ChatMessage(role=MessageRole.USER, content="bonjour")

        with pytest.raises(Exception):  # noqa: B017 (FrozenInstanceError)
            message.content = "autre"  # type: ignore[misc]
