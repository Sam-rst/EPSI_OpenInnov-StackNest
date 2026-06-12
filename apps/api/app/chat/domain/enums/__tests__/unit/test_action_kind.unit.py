"""Tests unitaires de l'enum ActionKind (nature d'une action proposee par le chat)."""

from app.chat.domain.enums.action_kind import ActionKind


class TestActionKindValeurs:
    def test_toutes_les_valeurs_attendues_existent(self) -> None:
        assert {kind.value for kind in ActionKind} == {
            "deploy",
            "stop",
            "start",
            "regenerate",
            "compose_stack",
        }

    def test_destroy_exclu_du_mvp(self) -> None:
        # `detruire` est volontairement hors perimetre du chat au MVP
        # (action irreversible -> reste dans l'UI deploiement). Cf. design.
        assert "destroy" not in {kind.value for kind in ActionKind}

    def test_compose_stack_compose_une_stack_multi_services(self) -> None:
        # Composer une stack multi-services cablee (en plus de deployer un
        # service unique) : nouvelle action confirmable, cf. design compose.
        assert ActionKind.COMPOSE_STACK.value == "compose_stack"

    def test_serialise_directement_en_chaine(self) -> None:
        assert ActionKind.DEPLOY.value == "deploy"
        assert str(ActionKind.REGENERATE) == "regenerate"
