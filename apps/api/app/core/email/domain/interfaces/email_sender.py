"""Interface (Protocol) pour l'envoi d'emails."""

from typing import Protocol, runtime_checkable

from app.core.email.domain.value_objects.email_message import EmailMessage


@runtime_checkable
class EmailSender(Protocol):
    """Contrat qu'un service d'envoi d'emails doit implementer.

    Implementations typiques (infrastructure/) :

    - `SmtpEmailSender` : envoi via SMTP classique (aiosmtplib)
    - `SendgridEmailSender` : envoi via API Sendgrid (ticket futur)
    - `SesEmailSender` : envoi via AWS SES (ticket futur)

    L'implementation doit lever `EmailDeliveryException` en cas d'echec
    (timeout, auth SMTP refusee, relay impossible, ...) pour que le use case
    appelant puisse decider de la politique retry / queue dead-letter.
    """

    async def send(self, message: EmailMessage) -> None:
        """Envoie le message. Leve EmailDeliveryException en cas d'echec."""
        ...
