"""Value object ChatMessage : message d'historique transmis au LLM."""

from dataclasses import dataclass

from app.chat.domain.enums.message_role import MessageRole


@dataclass(frozen=True)
class ChatMessage:
    """Message de conversation tel que consomme par le port `LLMProvider`.

    Immutable : represente une entree de l'historique passe au modele (role +
    contenu), independamment de la persistance (`Message`) et du format propre a
    chaque fournisseur (traduit par les adaptateurs en vague 2).

    Le contenu peut etre vide : un message assistant ne portant qu'un appel
    d'outil n'a pas de texte. Aucune validation de longueur ici (le budget de
    tokens releve d'une garde metier, pas du value object).

    - `role`    : emetteur du message (user / assistant / tool).
    - `content` : texte du message (eventuellement vide).
    """

    role: MessageRole
    content: str
