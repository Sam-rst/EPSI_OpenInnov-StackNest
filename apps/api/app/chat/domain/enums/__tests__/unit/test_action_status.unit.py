"""Tests unitaires de l'enum ActionStatus (cycle de vie d'une action de chat)."""

from app.chat.domain.enums.action_status import ActionStatus


class TestActionStatusValeurs:
    def test_toutes_les_valeurs_attendues_existent(self) -> None:
        assert {statut.value for statut in ActionStatus} == {
            "proposed",
            "confirmed",
            "rejected",
            "executed",
            "failed",
        }

    def test_serialise_directement_en_chaine(self) -> None:
        assert ActionStatus.PROPOSED.value == "proposed"
        assert str(ActionStatus.EXECUTED) == "executed"
