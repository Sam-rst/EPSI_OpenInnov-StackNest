"""Value object representant un message email a envoyer."""

from dataclasses import dataclass


@dataclass(frozen=True)
class EmailMessage:
    """Message email multipart (HTML + texte) pret a etre envoye.

    Immutable (frozen). Les guard clauses dans __post_init__ garantissent
    des invariants :

    - `to` : non vide + contient '@' (verification minimale, la validation
      stricte RFC 5322 n'est pas souhaitable ici — laissee au serveur SMTP).
    - `subject` / `body_html` / `body_text` : non vides (multipart alternative
      requiert les deux corps pour la livraison optimale).
    """

    to: str
    subject: str
    body_html: str
    body_text: str

    def __post_init__(self) -> None:
        if not self.to:
            raise ValueError("EmailMessage.to must not be empty")
        if "@" not in self.to:
            raise ValueError(f"EmailMessage.to is not a valid email address: '{self.to}'")
        if not self.subject:
            raise ValueError("EmailMessage.subject must not be empty")
        if not self.body_html:
            raise ValueError("EmailMessage.body_html must not be empty")
        if not self.body_text:
            raise ValueError("EmailMessage.body_text must not be empty")
