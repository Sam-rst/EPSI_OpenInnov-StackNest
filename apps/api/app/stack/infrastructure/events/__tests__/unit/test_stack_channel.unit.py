"""Tests unitaires du nommage du canal Redis pub/sub d'une stack."""

from uuid import UUID

from app.stack.infrastructure.events.stack_channel import stack_channel


class TestStackChannel:
    def test_format_du_canal(self) -> None:
        stack_id = UUID("11111111-1111-1111-1111-111111111111")

        assert stack_channel(stack_id) == "stack:11111111-1111-1111-1111-111111111111"
