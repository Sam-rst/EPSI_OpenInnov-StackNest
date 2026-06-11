"""Flux SSE des events de stack avec keepalive (heartbeat) pendant le silence.

Probleme resolu (cf. helper du chat dont ce module s'inspire) : pendant un
`docker compose up` long (pull d'images, demarrage des conteneurs), le canal
Redis de la stack ne publie aucun event ; la connexion SSE reste idle et finit
coupee par le navigateur / le reverse-proxy. On insere donc un commentaire SSE
inerte (`: keepalive`) toutes les `_SSE_KEEPALIVE_SECONDS` tant qu'aucun event
reel n'arrive : le navigateur l'ignore, mais le trafic garde la connexion vivante.

Reste testable sans Redis : il enveloppe n'importe quel `AsyncIterator[StackEvent]`.
"""

import asyncio
import contextlib
from collections.abc import AsyncGenerator, AsyncIterator
from typing import Any

from app.stack.domain.value_objects.stack_event import StackEvent
from app.stack.presentation.schemas.stack_event_sse import format_stack_event_sse

# Periode du heartbeat : un keepalive est emis si aucun event n'arrive dans ce
# delai. 15 s : largement sous les timeouts idle usuels (navigateur, nginx).
_SSE_KEEPALIVE_SECONDS = 15.0

# Commentaire SSE inerte (ligne prefixee par ':' + ligne vide). Ignore par les
# clients EventSource : ne declenche aucun handler d'event cote front.
SSE_KEEPALIVE_COMMENT = ": keepalive\n\n"


async def stack_sse_keepalive_stream(
    events: AsyncIterator[StackEvent],
    keepalive_seconds: float = _SSE_KEEPALIVE_SECONDS,
) -> AsyncGenerator[str]:
    """Re-emet les events `events` en trames SSE, avec keepalive sur silence.

    Course entre le prochain event de la source et un timeout :
    - timeout atteint -> emet `SSE_KEEPALIVE_COMMENT` et continue d'attendre le
      meme event (la tache `anext` survit aux keepalive) ;
    - event recu -> emet la trame formatee ;
    - source epuisee -> fin du flux.

    La source est toujours fermee (`aclose`) en sortie — fin normale, exception
    ou annulation (deconnexion client) — pour liberer le pub/sub Redis sous-jacent.
    """
    iterator = events.__aiter__()
    pending: asyncio.Future[StackEvent] | None = None
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
                yield format_stack_event_sse(event)
                break
    finally:
        await _cancel_quietly(pending)
        await _aclose_quietly(iterator)


async def _cancel_quietly(pending: "asyncio.Future[StackEvent] | None") -> None:
    """Annule la tache `anext` encore en vol (deconnexion pendant le silence)."""
    if pending is None or pending.done():
        return
    pending.cancel()
    with contextlib.suppress(asyncio.CancelledError, StopAsyncIteration):
        await pending


async def _aclose_quietly(iterator: AsyncIterator[StackEvent]) -> None:
    """Ferme l'iterateur source s'il expose `aclose` (libere le pub/sub Redis)."""
    aclose = getattr(iterator, "aclose", None)
    if aclose is not None:
        result: Any = aclose()
        if asyncio.iscoroutine(result):
            await result
