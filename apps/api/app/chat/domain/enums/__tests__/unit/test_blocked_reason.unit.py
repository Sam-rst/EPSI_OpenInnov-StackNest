"""Tests unitaires de l'enum BlockedReason (motif de non-deployabilite d'un template)."""

from app.chat.domain.enums.blocked_reason import BlockedReason


class TestBlockedReasonValeurs:
    def test_toutes_les_valeurs_attendues_existent(self) -> None:
        assert {reason.value for reason in BlockedReason} == {"terraform", "runtime"}

    def test_serialise_directement_en_chaine(self) -> None:
        assert BlockedReason.TERRAFORM.value == "terraform"
        assert str(BlockedReason.RUNTIME) == "runtime"
