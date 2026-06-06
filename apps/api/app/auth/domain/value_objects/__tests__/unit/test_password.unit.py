"""Tests unitaires du value object Password (politique de robustesse)."""

import pytest

from app.auth.domain.value_objects.password import Password


class TestPasswordPolicy:
    def test_accepte_un_mot_de_passe_conforme(self) -> None:
        password = Password("motdepasse1")

        assert password.value == "motdepasse1"

    def test_rejette_un_mot_de_passe_trop_court(self) -> None:
        with pytest.raises(ValueError):
            Password("court1")

    def test_rejette_un_mot_de_passe_sans_chiffre(self) -> None:
        with pytest.raises(ValueError):
            Password("motdepassesanschiffre")

    def test_accepte_pile_huit_caracteres_avec_chiffre(self) -> None:
        password = Password("abcdefg1")

        assert password.value == "abcdefg1"


class TestPasswordValueObject:
    def test_est_immutable(self) -> None:
        password = Password("motdepasse1")

        with pytest.raises(Exception):  # noqa: B017 - FrozenInstanceError selon impl
            password.value = "autre1234"  # type: ignore[misc]

    def test_str_ne_divulgue_pas_le_secret(self) -> None:
        # On ne doit jamais logguer le mot de passe en clair.
        assert "motdepasse1" not in str(Password("motdepasse1"))

    def test_repr_ne_divulgue_pas_le_secret(self) -> None:
        # repr() est utilise dans les traces / debuggers : doit aussi masquer.
        assert "motdepasse1" not in repr(Password("motdepasse1"))
