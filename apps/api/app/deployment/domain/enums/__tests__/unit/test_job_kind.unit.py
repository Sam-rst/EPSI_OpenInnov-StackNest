"""Tests unitaires de l'enum JobKind (types de jobs worker)."""

from app.deployment.domain.enums.job_kind import JobKind


class TestJobKindValeurs:
    def test_toutes_les_valeurs_attendues_existent(self) -> None:
        assert {kind.value for kind in JobKind} == {
            "provision",
            "stop",
            "start",
            "destroy",
            "regenerate",
        }

    def test_serialise_directement_en_chaine(self) -> None:
        assert JobKind.PROVISION == "provision"
        assert f"{JobKind.REGENERATE}" == "regenerate"
