"""Fabrique d'un SmtpEmailSender a partir des reglages SMTP du track auth."""

from app.auth.infrastructure.email.smtp_settings import SmtpSettings
from app.email.infrastructure.smtp_email_sender import SmtpEmailSender


def build_smtp_email_sender(settings: SmtpSettings) -> SmtpEmailSender:
    """Construit l'adaptateur SMTP (reutilise l'impl du module email du socle)."""
    return SmtpEmailSender(
        host=settings.smtp_host,
        port=settings.smtp_port,
        from_address=settings.smtp_from_address,
        username=settings.smtp_username,
        password=settings.smtp_password,
        use_starttls=settings.smtp_use_starttls,
    )
