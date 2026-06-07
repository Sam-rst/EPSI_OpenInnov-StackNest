"""Nommage du canal Redis pub/sub d'un deploiement.

Canal `deployment:{id}` (cf. design section 7) : le worker y publie les
transitions, l'endpoint SSE de l'API s'y abonne. Helper unique pour garder le
publisher et le subscriber alignes sur le meme format de canal.
"""

from uuid import UUID

_CHANNEL_PREFIX = "deployment:"


def deployment_channel(deployment_id: UUID) -> str:
    """Renvoie le nom du canal pub/sub du deploiement (`deployment:{id}`)."""
    return f"{_CHANNEL_PREFIX}{deployment_id}"
