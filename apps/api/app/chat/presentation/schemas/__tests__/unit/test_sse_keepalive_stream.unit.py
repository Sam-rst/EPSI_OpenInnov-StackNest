"""Tests unitaires du flux SSE avec keepalive (heartbeat) du chat.

Verifie que le generateur de presentation :
- emet un commentaire SSE `: keepalive` quand aucun event n'arrive pendant la
  periode (LLM lent : maintient la connexion idle ouverte) ;
- emet l'event reel formate (`event:`/`data:`) des qu'il arrive ;
- ferme proprement l'iterateur source (`aclose`) en fin de flux comme a
  l'annulation (deconnexion client), sans dependre d'un vrai Redis.
"""

import asyncio
from collections.abc import AsyncIterator

from app.chat.domain.value_objects.chat_event import ChatEvent
from app.chat.presentation.schemas.sse_keepalive_stream import (
    SSE_KEEPALIVE_COMMENT,
    sse_keepalive_stream,
)

# Periode courte pour des tests deterministes et rapides (vs 15 s en prod).
_FAST_KEEPALIVE = 0.02


class _RecordingEventSource:
    """Source asynchrone d'events controlable, qui memorise sa fermeture.

    `delay_before_first` simule un LLM lent : aucun event n'est disponible
    pendant ce laps de temps, ce qui doit declencher un (ou plusieurs) keepalive.
    """

    def __init__(self, events: list[ChatEvent], delay_before_first: float = 0.0) -> None:
        self._events = list(events)
        self._delay_before_first = delay_before_first
        self._first = True
        self.closed = False

    def __aiter__(self) -> "AsyncIterator[ChatEvent]":
        return self

    async def __anext__(self) -> ChatEvent:
        if self._first and self._delay_before_first > 0:
            self._first = False
            await asyncio.sleep(self._delay_before_first)
        if not self._events:
            raise StopAsyncIteration
        return self._events.pop(0)

    async def aclose(self) -> None:
        self.closed = True


class TestSseKeepaliveStream:
    async def test_emet_keepalive_pendant_le_silence_puis_event(self) -> None:
        event = ChatEvent(event="message", payload={"content": "Salut"})
        # Premier event en retard (3x la periode) : au moins un keepalive attendu.
        source = _RecordingEventSource([event], delay_before_first=_FAST_KEEPALIVE * 3)

        frames = [frame async for frame in sse_keepalive_stream(source, _FAST_KEEPALIVE)]

        assert SSE_KEEPALIVE_COMMENT in frames
        assert frames[-1].startswith("event: message\n")
        assert '"content": "Salut"' in frames[-1]

    async def test_event_immediat_n_emet_pas_de_keepalive(self) -> None:
        event = ChatEvent(event="token", payload={"delta": "Bon"})
        source = _RecordingEventSource([event])

        frames = [frame async for frame in sse_keepalive_stream(source, _FAST_KEEPALIVE)]

        assert SSE_KEEPALIVE_COMMENT not in frames
        assert frames == ['event: token\ndata: {"delta": "Bon"}\n\n']

    async def test_keepalive_est_un_commentaire_sse_inerte(self) -> None:
        # Un commentaire SSE commence par ':' et se termine par une ligne vide ;
        # il ne porte ni `event:` ni `data:`, donc n'altere pas le contrat front.
        assert SSE_KEEPALIVE_COMMENT.startswith(":")
        assert SSE_KEEPALIVE_COMMENT.endswith("\n\n")
        assert "event:" not in SSE_KEEPALIVE_COMMENT
        assert "data:" not in SSE_KEEPALIVE_COMMENT

    async def test_ferme_la_source_en_fin_de_flux(self) -> None:
        source = _RecordingEventSource([ChatEvent(event="message", payload={})])

        async for _ in sse_keepalive_stream(source, _FAST_KEEPALIVE):
            pass

        assert source.closed is True

    async def test_annulation_ferme_la_source(self) -> None:
        # Source qui ne yield jamais d'event : on annule la consommation et on
        # verifie que le `finally` du generateur ferme bien l'iterateur source.
        never_arriving = _RecordingEventSource([], delay_before_first=10.0)
        stream = sse_keepalive_stream(never_arriving, _FAST_KEEPALIVE)

        async def consume_one_keepalive() -> None:
            async for _ in stream:
                break  # on a recu un keepalive, on coupe

        await asyncio.wait_for(consume_one_keepalive(), timeout=1.0)
        await stream.aclose()

        assert never_arriving.closed is True
