"""Nommage du canal Redis pub/sub d'une conversation de chat.

Canal `chat:{conversation_id}` (cf. design) : le use case `SendMessage` y publie
les tokens, messages, propositions et resultats d'action ; l'endpoint SSE de
l'API s'y abonne. Helper unique pour garder le publisher et le subscriber
alignes sur le meme format de canal (meme mecanisme que le deploiement).
"""

from uuid import UUID

_CHANNEL_PREFIX = "chat:"


def chat_channel(conversation_id: UUID) -> str:
    """Renvoie le nom du canal pub/sub de la conversation (`chat:{id}`)."""
    return f"{_CHANNEL_PREFIX}{conversation_id}"
