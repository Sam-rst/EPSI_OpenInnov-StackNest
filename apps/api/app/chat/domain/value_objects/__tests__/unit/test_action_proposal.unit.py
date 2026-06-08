"""Tests unitaires du value object ActionProposal (action validee a confirmer)."""

import pytest

from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.value_objects.action_proposal import ActionProposal


def _proposal(**overrides: object) -> ActionProposal:
    params: dict[str, object] = {
        "kind": ActionKind.DEPLOY,
        "args": {"template_id": "abc", "version": "16"},
        "restatement": "Je vais deployer un PostgreSQL 16 pour vos tests.",
        "recap": {"template": "PostgreSQL", "version": "16", "cpu": "1", "mem": "512m"},
    }
    params.update(overrides)
    return ActionProposal(**params)  # type: ignore[arg-type]


class TestActionProposalValide:
    def test_construction_nominale(self) -> None:
        proposal = _proposal()

        assert proposal.kind is ActionKind.DEPLOY
        assert proposal.args == {"template_id": "abc", "version": "16"}
        assert proposal.restatement.startswith("Je vais deployer")
        assert proposal.recap["template"] == "PostgreSQL"

    def test_recap_vide_autorise(self) -> None:
        proposal = _proposal(recap={})

        assert proposal.recap == {}

    def test_est_immutable(self) -> None:
        proposal = _proposal()

        with pytest.raises(Exception):  # noqa: B017 (FrozenInstanceError)
            proposal.restatement = "autre"  # type: ignore[misc]


class TestActionProposalGuards:
    def test_reformulation_vide_leve_value_error(self) -> None:
        # La reformulation explicite est la 4e couche anti-hallucination : elle
        # ne peut jamais etre vide (l'utilisateur doit voir ce qu'il confirme).
        with pytest.raises(ValueError):
            _proposal(restatement="   ")
