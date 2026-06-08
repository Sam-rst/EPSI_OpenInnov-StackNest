"""Tests unitaires de l'enum MessageRole (roles d'un message de conversation)."""

from app.chat.domain.enums.message_role import MessageRole


class TestMessageRoleValeurs:
    def test_toutes_les_valeurs_attendues_existent(self) -> None:
        assert {role.value for role in MessageRole} == {"user", "assistant", "tool"}

    def test_serialise_directement_en_chaine(self) -> None:
        # StrEnum : la valeur se serialise directement en chaine.
        assert MessageRole.USER.value == "user"
        assert str(MessageRole.ASSISTANT) == "assistant"
        assert MessageRole.TOOL.value == "tool"
