"""Tests unitaires de l'enum ActionKind (nature d'une action proposee par le chat)."""

from app.chat.domain.enums.action_kind import ActionKind


class TestActionKindValeurs:
    def test_toutes_les_valeurs_attendues_existent(self) -> None:
        assert {kind.value for kind in ActionKind} == {
            "deploy",
            "stop",
            "start",
            "regenerate",
        }

    def test_destroy_exclu_du_mvp(self) -> None:
        # `detruire` est volontairement hors perimetre du chat au MVP
        # (action irreversible -> reste dans l'UI deploiement). Cf. design.
        assert "destroy" not in {kind.value for kind in ActionKind}

    def test_serialise_directement_en_chaine(self) -> None:
        assert ActionKind.DEPLOY.value == "deploy"
        assert str(ActionKind.REGENERATE) == "regenerate"
