"""Tests unitaires du flux SSE avec keepalive (heartbeat) des stacks."""

import asyncio
from collections.abc import AsyncIterator

from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.value_objects.stack_event import StackEvent
from app.stack.presentation.schemas.stack_sse_keepalive_stream import (
    SSE_KEEPALIVE_COMMENT,
    stack_sse_keepalive_stream,
)

# Periode courte pour des tests deterministes et rapides (vs 15 s en prod).
_FAST_KEEPALIVE = 0.02


class _RecordingEventSource:
    """Source asynchrone d'events controlable, qui memorise sa fermeture."""

    def __init__(self, events: list[StackEvent], delay_before_first: float = 0.0) -> None:
        self._events = list(events)
        self._delay_before_first = delay_before_first
        self._first = True
        self.closed = False

    def __aiter__(self) -> "AsyncIterator[StackEvent]":
        return self

    async def __anext__(self) -> StackEvent:
        if self._first and self._delay_before_first > 0:
            self._first = False
            await asyncio.sleep(self._delay_before_first)
        if not self._events:
            raise StopAsyncIteration
        return self._events.pop(0)

    async def aclose(self) -> None:
        self.closed = True


class TestStackSseKeepaliveStream:
    async def test_emet_keepalive_pendant_le_silence_puis_event(self) -> None:
        event = StackEvent(stack_status=StackStatus.RUNNING)
        source = _RecordingEventSource([event], delay_before_first=_FAST_KEEPALIVE * 3)

        frames = [frame async for frame in stack_sse_keepalive_stream(source, _FAST_KEEPALIVE)]

        assert SSE_KEEPALIVE_COMMENT in frames
        assert frames[-1].startswith("event: running\n")

    async def test_event_immediat_n_emet_pas_de_keepalive(self) -> None:
        event = StackEvent(stack_status=StackStatus.PROVISIONING)
        source = _RecordingEventSource([event])

        frames = [frame async for frame in stack_sse_keepalive_stream(source, _FAST_KEEPALIVE)]

        assert SSE_KEEPALIVE_COMMENT not in frames
        assert frames[0].startswith("event: provisioning\n")

    async def test_ferme_la_source_en_fin_de_flux(self) -> None:
        source = _RecordingEventSource([StackEvent(stack_status=StackStatus.RUNNING)])

        async for _ in stack_sse_keepalive_stream(source, _FAST_KEEPALIVE):
            pass

        assert source.closed is True

    async def test_annulation_ferme_la_source(self) -> None:
        never_arriving = _RecordingEventSource([], delay_before_first=10.0)
        stream = stack_sse_keepalive_stream(never_arriving, _FAST_KEEPALIVE)

        async def consume_one_keepalive() -> None:
            async for _ in stream:
                break

        await asyncio.wait_for(consume_one_keepalive(), timeout=1.0)
        await stream.aclose()

        assert never_arriving.closed is True
