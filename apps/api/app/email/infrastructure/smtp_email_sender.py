"""Implementation SMTP du port EmailSender via aiosmtplib."""

import contextlib
import hashlib
from email.message import EmailMessage as StdlibEmailMessage

import structlog
from aiosmtplib import SMTP

from app.email.domain.exceptions.email_delivery_exception import EmailDeliveryException
from app.email.domain.value_objects.email_message import EmailMessage

_logger = structlog.get_logger(__name__)


class SmtpEmailSender:
    """Envoie des emails via un serveur SMTP classique (TLS STARTTLS).

    Les credentials sont injectes au constructeur (pas de lecture d'env ici).
    STN-35 s'occupera de la configuration via SOPS + pydantic-settings.

    Releve de la politique `try/except sur infrastructure uniquement` :
    toute erreur aiosmtplib / reseau est convertie en `EmailDeliveryException`
    avec la cause originale preservee via `raise ... from err`.
    """

    def __init__(
        self,
        *,
        host: str,
        port: int,
        from_address: str,
        username: str | None = None,
        password: str | None = None,
        use_starttls: bool = True,
    ) -> None:
        self._host = host
        self._port = port
        self._username = username
        self._password = password
        self._from_address = from_address
        self._use_starttls = use_starttls

    async def send(self, message: EmailMessage) -> None:
        mime_message = self._build_mime_message(message)
        smtp = SMTP(
            hostname=self._host,
            port=self._port,
            use_tls=False,
            start_tls=self._use_starttls,
        )

        try:
            await smtp.connect()
            if self._username is not None:
                await smtp.login(self._username, self._password or "")
            await smtp.send_message(mime_message)
        except Exception as err:
            raise EmailDeliveryException(f"SMTP delivery failed for {message.to}: {err}") from err
        finally:
            # Un quit() sur un socket jamais connecte (connect() a echoue)
            # peut lever. On supprime l'erreur pour ne pas masquer
            # l'EmailDeliveryException en cours de propagation (Python
            # remplace l'exception si un finally leve).
            with contextlib.suppress(Exception):
                await smtp.quit()

        _logger.info(
            "email.sent",
            to=message.to,
            subject_hash=hashlib.sha256(message.subject.encode("utf-8")).hexdigest()[:16],
        )

    def _build_mime_message(self, message: EmailMessage) -> StdlibEmailMessage:
        mime = StdlibEmailMessage()
        mime["Subject"] = message.subject
        mime["From"] = self._from_address
        mime["To"] = message.to
        mime.set_content(message.body_text, subtype="plain", charset="utf-8")
        mime.add_alternative(message.body_html, subtype="html", charset="utf-8")
        return mime
