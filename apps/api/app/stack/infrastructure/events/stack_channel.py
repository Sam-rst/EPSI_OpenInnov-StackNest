"""Nommage du canal Redis pub/sub d'une stack.

Canal `stack:{id}` (cf. spec SSE) : le worker y publie les transitions (niveau
stack et par service), l'endpoint SSE de l'API s'y abonne. Helper unique pour
garder le publisher et le subscriber alignes sur le meme format de canal.
"""

from uuid import UUID

_CHANNEL_PREFIX = "stack:"


def stack_channel(stack_id: UUID) -> str:
    """Renvoie le nom du canal pub/sub de la stack (`stack:{id}`)."""
    return f"{_CHANNEL_PREFIX}{stack_id}"
