"""Commande applicative d'envoi d'un message dans une conversation."""

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class SendMessageCommand:
    """Donnees d'entree du use case `SendMessage` (DTO applicatif).

    Decouple la presentation du use case : la couche presentation traduit la
    requete HTTP + l'utilisateur authentifie en cette commande. Immutable.

    - `conversation_id` : fil dans lequel poster le message.
    - `owner_id`        : utilisateur authentifie (isolation des acces).
    - `content`         : texte saisi par l'utilisateur (non vide cote schema).
    """

    conversation_id: UUID
    owner_id: UUID
    content: str
