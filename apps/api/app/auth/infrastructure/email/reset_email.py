"""Constructeur du message email de reinitialisation de mot de passe (FR)."""

from app.auth.domain.value_objects.email import Email
from app.email.domain.value_objects.email_message import EmailMessage

_SUBJECT = "Reinitialisation de votre mot de passe — StackNest"


class ResetEmail:
    """Fabrique l'`EmailMessage` de reinitialisation a partir d'un token reset.

    Le lien pointe vers la page front `reset?token=...` : l'utilisateur clique,
    saisit un nouveau mot de passe, la page poste le token + le mot de passe sur
    `POST /auth/reset`. Le token est porte en query string (court, single-use
    cote metier via le bump de `token_version`).
    """

    @staticmethod
    def build(*, recipient: Email, token: str, reset_url_base: str) -> EmailMessage:
        link = f"{reset_url_base}?token={token}"
        body_text = (
            "Vous avez demande la reinitialisation de votre mot de passe StackNest.\n\n"
            f"Ouvrez le lien suivant pour choisir un nouveau mot de passe :\n{link}\n\n"
            "Si vous n'etes pas a l'origine de cette demande, ignorez ce message : "
            "votre mot de passe actuel reste valide."
        )
        body_html = (
            "<p>Vous avez demande la reinitialisation de votre mot de passe StackNest.</p>"
            f'<p>Choisissez un nouveau mot de passe via ce lien : <a href="{link}">'
            "Reinitialiser mon mot de passe</a>.</p>"
            "<p>Si vous n'etes pas a l'origine de cette demande, ignorez ce message : "
            "votre mot de passe actuel reste valide.</p>"
        )
        return EmailMessage(
            to=recipient.value,
            subject=_SUBJECT,
            body_html=body_html,
            body_text=body_text,
        )
