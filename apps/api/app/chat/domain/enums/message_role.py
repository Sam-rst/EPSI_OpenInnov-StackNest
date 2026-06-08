"""Roles possibles d'un message dans une conversation (cote modele LLM)."""

from enum import StrEnum


class MessageRole(StrEnum):
    """Role d'un message echange dans une conversation de chat.

    Aligne sur la convention des APIs de chat (OpenAI / Anthropic / Ollama) afin
    que les adaptateurs LLM (vague 2) traduisent sans ambiguite l'historique.

    StrEnum : la valeur se serialise directement en chaine pour le stockage
    (colonne enum Postgres `message_role`) et pour la construction du contexte
    transmis au LLM.

    - `user`      : message saisi par l'utilisateur.
    - `assistant` : reponse generee par le modele.
    - `tool`      : resultat d'un appel d'outil reinjecte dans la conversation.
    """

    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"
