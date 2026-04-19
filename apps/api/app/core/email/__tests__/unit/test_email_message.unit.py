"""Tests unitaires du Value Object EmailMessage."""

import pytest

from app.core.email.domain.value_objects.email_message import EmailMessage


class TestEmailMessage:
    def test_cree_un_message_valide(self) -> None:
        message = EmailMessage(
            to="user@example.com",
            subject="Bienvenue",
            body_html="<p>Bonjour</p>",
            body_text="Bonjour",
        )

        assert message.to == "user@example.com"
        assert message.subject == "Bienvenue"
        assert message.body_html == "<p>Bonjour</p>"
        assert message.body_text == "Bonjour"

    def test_est_frozen(self) -> None:
        from dataclasses import FrozenInstanceError

        message = EmailMessage(
            to="user@example.com",
            subject="s",
            body_html="h",
            body_text="t",
        )

        with pytest.raises(FrozenInstanceError):
            message.to = "other@example.com"  # type: ignore[misc]

    def test_refuse_destinataire_vide(self) -> None:
        with pytest.raises(ValueError, match="to"):
            EmailMessage(to="", subject="s", body_html="h", body_text="t")

    def test_refuse_destinataire_sans_arobase(self) -> None:
        with pytest.raises(ValueError, match="email"):
            EmailMessage(to="pas-un-email", subject="s", body_html="h", body_text="t")

    def test_refuse_sujet_vide(self) -> None:
        with pytest.raises(ValueError, match="subject"):
            EmailMessage(to="user@example.com", subject="", body_html="h", body_text="t")

    def test_refuse_corps_html_vide(self) -> None:
        with pytest.raises(ValueError, match="body_html"):
            EmailMessage(to="user@example.com", subject="s", body_html="", body_text="t")

    def test_refuse_corps_texte_vide(self) -> None:
        with pytest.raises(ValueError, match="body_text"):
            EmailMessage(to="user@example.com", subject="s", body_html="h", body_text="")
