"""Tests unitaires de l'exception ChatActionNotFoundException (code + statut)."""

from app.chat.domain.exceptions.chat_action_not_found import (
    ChatActionNotFoundException,
)
from app.shared.exceptions.domain_exception import DomainException


class TestChatActionNotFoundException:
    def test_est_une_domain_exception(self) -> None:
        assert issubclass(ChatActionNotFoundException, DomainException)

    def test_code_et_statut(self) -> None:
        exc = ChatActionNotFoundException()

        assert exc.code == "CHAT_ACTION_NOT_FOUND"
        assert exc.http_status == 404

    def test_message_personnalisable(self) -> None:
        exc = ChatActionNotFoundException("Action introuvable.")

        assert exc.message == "Action introuvable."
