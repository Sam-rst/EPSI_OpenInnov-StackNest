"""Constructeur du message email de verification d'adresse (templates FR)."""

from app.auth.domain.value_objects.email import Email
from app.email.domain.value_objects.email_message import EmailMessage

_SUBJECT = "Verifiez votre adresse email — StackNest"


class VerificationEmail:
    """Fabrique l'`EmailMessage` de verification d'adresse a partir d'un token.

    Le lien pointe vers la page front `verify?token=...` : l'utilisateur clique,
    la page poste le token sur `POST /auth/verify`. Le token est porte en query
    string (pattern standard, court et single-use cote metier).
    """

    @staticmethod
    def build(*, recipient: Email, token: str, verify_url_base: str) -> EmailMessage:
        link = f"{verify_url_base}?token={token}"
        body_text = (
            "Bienvenue sur StackNest.\n\n"
            "Pour activer votre compte, verifiez votre adresse email en ouvrant "
            f"le lien suivant :\n{link}\n\n"
            "Si vous n'etes pas a l'origine de cette inscription, ignorez ce message."
        )
        body_html = (
            "<p>Bienvenue sur StackNest.</p>"
            "<p>Pour activer votre compte, verifiez votre adresse email "
            f'en cliquant sur ce lien : <a href="{link}">Verifier mon adresse</a>.</p>'
            "<p>Si vous n'etes pas a l'origine de cette inscription, ignorez ce message.</p>"
        )
        return EmailMessage(
            to=recipient.value,
            subject=_SUBJECT,
            body_html=body_html,
            body_text=body_text,
        )
