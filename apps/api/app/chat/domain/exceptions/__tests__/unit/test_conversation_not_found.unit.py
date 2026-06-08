"""Tests unitaires de l'exception ConversationNotFoundException (code + statut)."""

from app.chat.domain.exceptions.conversation_not_found import (
    ConversationNotFoundException,
)
from app.shared.exceptions.domain_exception import DomainException


class TestConversationNotFoundException:
    def test_est_une_domain_exception(self) -> None:
        assert issubclass(ConversationNotFoundException, DomainException)

    def test_code_et_statut(self) -> None:
        exc = ConversationNotFoundException()

        assert exc.code == "CONVERSATION_NOT_FOUND"
        assert exc.http_status == 404

    def test_message_personnalisable(self) -> None:
        exc = ConversationNotFoundException("Fil introuvable pour cet utilisateur.")

        assert exc.message == "Fil introuvable pour cet utilisateur."
