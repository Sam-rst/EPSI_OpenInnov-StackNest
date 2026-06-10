"""Flux SSE du chat avec keepalive (heartbeat) pendant le silence du LLM.

Probleme resolu : un LLM local (Ollama CPU) peut mettre ~30 s a produire le
premier token. Pendant ce silence, le canal Redis ne publie aucun event, la
connexion SSE reste idle et finit coupee par le navigateur / le reverse-proxy
(« connexion au chat perdue »). On insere donc un commentaire SSE inerte
(`: keepalive`) toutes les `_SSE_KEEPALIVE_SECONDS` tant qu'aucun event reel
n'arrive : le navigateur l'ignore (commentaire), mais le trafic suffit a garder
la connexion vivante. Le contrat des events reels (`event:`/`data:`) et le front
sont inchanges.

Ce helper vit en presentation (la ou se trouve deja le formatage SSE) et reste
testable sans Redis : il enveloppe n'importe quel `AsyncIterator[ChatEvent]`.
"""

import asyncio
import contextlib
from collections.abc import AsyncGenerator, AsyncIterator
from typing import Any

from app.chat.domain.value_objects.chat_event import ChatEvent
from app.chat.presentation.schemas.chat_event_sse import format_chat_event_sse

# Periode du heartbeat : un keepalive est emis si aucun event n'arrive dans ce
# delai. 15 s : largement sous les timeouts idle usuels (navigateur, nginx) tout
# en restant discret.
_SSE_KEEPALIVE_SECONDS = 15.0

# Commentaire SSE inerte (ligne prefixee par ':' + ligne vide). Ignore par les
# clients EventSource : ne declenche aucun handler d'event cote front.
SSE_KEEPALIVE_COMMENT = ": keepalive\n\n"


async def sse_keepalive_stream(
    events: AsyncIterator[ChatEvent],
    keepalive_seconds: float = _SSE_KEEPALIVE_SECONDS,
) -> AsyncGenerator[str]:
    """Re-emet les events `events` en trames SSE, avec keepalive sur silence.

    Fait une course entre le prochain event de la source et un timeout :
    - timeout atteint -> emet `SSE_KEEPALIVE_COMMENT` et continue d'attendre le
      meme event (la tache `anext` n'est pas relancee, elle survit aux keepalive) ;
    - event recu -> emet la trame formatee ;
    - source epuisee -> fin du flux.

    La source est toujours fermee (`aclose`) en sortie — fin normale, exception
    ou annulation (deconnexion client) — pour liberer le pub/sub Redis sous-jacent.
    """
    iterator = events.__aiter__()
    pending: asyncio.Future[ChatEvent] | None = None
    try:
        while True:
            pending = asyncio.ensure_future(iterator.__anext__())
            while True:
                try:
                    event = await asyncio.wait_for(
                        asyncio.shield(pending), timeout=keepalive_seconds
                    )
                except TimeoutError:
                    yield SSE_KEEPALIVE_COMMENT
                    continue
                except StopAsyncIteration:
                    pending = None
                    return
                pending = None
                yield format_chat_event_sse(event)
                break
    finally:
        await _cancel_quietly(pending)
        await _aclose_quietly(iterator)


async def _cancel_quietly(pending: "asyncio.Future[ChatEvent] | None") -> None:
    """Annule la tache `anext` encore en vol (deconnexion pendant le silence).

    Sans ca, `asyncio.shield` laisse la tache courir apres fermeture du
    generateur, d'ou un avertissement « Task was destroyed but it is pending ».
    """
    if pending is None or pending.done():
        return
    pending.cancel()
    with contextlib.suppress(asyncio.CancelledError, StopAsyncIteration):
        await pending


async def _aclose_quietly(iterator: AsyncIterator[ChatEvent]) -> None:
    """Ferme l'iterateur source s'il expose `aclose` (libere le pub/sub Redis)."""
    aclose = getattr(iterator, "aclose", None)
    if aclose is not None:
        result: Any = aclose()
        if asyncio.iscoroutine(result):
            await result
