"""Exception metier : l'envoi d'un email a echoue au niveau infrastructure."""

from app.shared.exceptions.domain_exception import DomainException


class EmailDeliveryException(DomainException):
    """Levee quand un `EmailSender` ne peut pas livrer le message.

    Causes typiques :

    - Timeout reseau vers le serveur SMTP
    - Authentification SMTP refusee (credentials invalides)
    - Destinataire refuse par le serveur (format invalide remonte par
      le relay, domaine inexistant, ...)
    - Serveur SMTP down ou injoignable

    Transformee en HTTP 502 Bad Gateway `{ error: EMAIL_DELIVERY_FAILED, message }`
    par le handler global. Le use case appelant ne doit pas l'attraper
    (policy try/catch sur infrastructure uniquement) — sauf s'il souhaite
    implementer un fallback (retry, queue, provider alternatif).
    """

    def __init__(self, message: str, *, cause: Exception | None = None) -> None:
        super().__init__(
            code="EMAIL_DELIVERY_FAILED",
            message=message,
            http_status=502,
        )
        self.__cause__ = cause
