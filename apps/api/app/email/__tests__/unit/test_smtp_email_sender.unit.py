"""Tests unitaires du SmtpEmailSender (mock aiosmtplib)."""

from email.message import EmailMessage as StdlibEmailMessage
from unittest.mock import AsyncMock, patch

import pytest
from structlog.testing import capture_logs

from app.email.domain.exceptions.email_delivery_exception import EmailDeliveryException
from app.email.domain.value_objects.email_message import EmailMessage
from app.email.infrastructure.smtp_email_sender import SmtpEmailSender


class TestSmtpEmailSenderSuccess:
    async def test_envoie_un_message_multipart_via_aiosmtplib(self) -> None:
        sender = SmtpEmailSender(
            host="smtp.example.com",
            port=587,
            username="noreply@example.com",
            password="secret",
            from_address="noreply@example.com",
        )
        message = EmailMessage(
            to="user@example.com",
            subject="Bienvenue",
            body_html="<p>Bonjour</p>",
            body_text="Bonjour",
        )

        with patch("app.email.infrastructure.smtp_email_sender.SMTP") as smtp_class:
            smtp_instance = AsyncMock()
            smtp_class.return_value = smtp_instance

            await sender.send(message)

            smtp_class.assert_called_once_with(
                hostname="smtp.example.com", port=587, use_tls=False, start_tls=True
            )
            smtp_instance.connect.assert_awaited_once()
            smtp_instance.login.assert_awaited_once_with("noreply@example.com", "secret")
            smtp_instance.send_message.assert_awaited_once()
            smtp_instance.quit.assert_awaited_once()

            sent_message = smtp_instance.send_message.await_args.args[0]
            assert isinstance(sent_message, StdlibEmailMessage)
            assert sent_message["Subject"] == "Bienvenue"
            assert sent_message["To"] == "user@example.com"
            assert sent_message["From"] == "noreply@example.com"
            assert sent_message.is_multipart() is True
            payloads = {
                part.get_content_type(): part.get_content() for part in sent_message.iter_parts()
            }
            assert "Bonjour" in payloads["text/plain"]
            assert "<p>Bonjour</p>" in payloads["text/html"]


class TestSmtpEmailSenderLogging:
    async def test_emet_un_log_structlog_sans_fuite_contenu(self) -> None:
        sender = SmtpEmailSender(
            host="smtp.example.com",
            port=587,
            username="u",
            password="p",
            from_address="noreply@example.com",
        )
        message = EmailMessage(
            to="user@example.com",
            subject="Contenu sensible",
            body_html="<p>x</p>",
            body_text="x",
        )

        with patch("app.email.infrastructure.smtp_email_sender.SMTP") as smtp_class:
            smtp_class.return_value = AsyncMock()

            with capture_logs() as logs:
                await sender.send(message)

        sent_logs = [log for log in logs if log.get("event") == "email.sent"]
        assert len(sent_logs) == 1
        sent_log = sent_logs[0]
        assert sent_log["to"] == "user@example.com"
        assert "subject_hash" in sent_log
        # Pas de fuite du sujet / body en clair
        assert "Contenu sensible" not in str(sent_log)
        assert sent_log.get("body_html") is None
        assert sent_log.get("body_text") is None


class TestSmtpEmailSenderFailure:
    async def test_leve_email_delivery_exception_sur_erreur_smtp(self) -> None:
        sender = SmtpEmailSender(
            host="smtp.example.com",
            port=587,
            username="u",
            password="p",
            from_address="noreply@example.com",
        )
        message = EmailMessage(
            to="user@example.com",
            subject="s",
            body_html="h",
            body_text="t",
        )

        with patch("app.email.infrastructure.smtp_email_sender.SMTP") as smtp_class:
            smtp_instance = AsyncMock()
            smtp_instance.connect.side_effect = TimeoutError("connect timed out")
            smtp_class.return_value = smtp_instance

            with pytest.raises(EmailDeliveryException) as exc_info:
                await sender.send(message)

        assert exc_info.value.code == "EMAIL_DELIVERY_FAILED"
        assert exc_info.value.http_status == 502
        assert isinstance(exc_info.value.__cause__, TimeoutError)

    async def test_quit_meme_si_send_message_echoue(self) -> None:
        """La ressource SMTP doit etre liberee meme en cas d'erreur (no leak)."""
        sender = SmtpEmailSender(
            host="smtp.example.com",
            port=587,
            username="u",
            password="p",
            from_address="noreply@example.com",
        )
        message = EmailMessage(
            to="user@example.com",
            subject="s",
            body_html="h",
            body_text="t",
        )

        with patch("app.email.infrastructure.smtp_email_sender.SMTP") as smtp_class:
            smtp_instance = AsyncMock()
            smtp_instance.send_message.side_effect = RuntimeError("relay refused")
            smtp_class.return_value = smtp_instance

            with pytest.raises(EmailDeliveryException):
                await sender.send(message)

            smtp_instance.quit.assert_awaited_once()
