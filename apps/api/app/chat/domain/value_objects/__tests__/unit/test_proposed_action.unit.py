"""Tests unitaires du value object ProposedAction (récap public rejouable)."""

from uuid import uuid4

import pytest

from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.value_objects.proposed_action import ProposedAction


class TestProposedAction:
    def test_porte_l_identite_et_le_recap_public(self) -> None:
        action_id = uuid4()
        message_id = uuid4()

        view = ProposedAction(
            action_id=action_id,
            message_id=message_id,
            kind=ActionKind.DEPLOY,
            recap={"template": "PostgreSQL", "version": "16"},
        )

        assert view.action_id == action_id
        assert view.message_id == message_id
        assert view.kind is ActionKind.DEPLOY
        assert view.recap == {"template": "PostgreSQL", "version": "16"}

    def test_recap_par_defaut_vide(self) -> None:
        view = ProposedAction(action_id=uuid4(), message_id=uuid4(), kind=ActionKind.STOP)

        assert view.recap == {}

    def test_est_immutable(self) -> None:
        view = ProposedAction(action_id=uuid4(), message_id=uuid4(), kind=ActionKind.START)

        with pytest.raises(AttributeError):
            view.kind = ActionKind.STOP  # type: ignore[misc]
