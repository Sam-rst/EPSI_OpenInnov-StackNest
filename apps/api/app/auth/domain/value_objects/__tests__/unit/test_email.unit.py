"""Tests unitaires du value object Email."""

import pytest

from app.auth.domain.value_objects.email import Email


class TestEmailValidation:
    def test_accepte_un_email_valide(self) -> None:
        email = Email("user@stacknest.local")

        assert email.value == "user@stacknest.local"

    @pytest.mark.parametrize(
        "invalide",
        ["", "   ", "pasdemail", "sans@domaine", "@sanslocal.com", "espace dans@mail.com"],
    )
    def test_rejette_un_email_invalide(self, invalide: str) -> None:
        with pytest.raises(ValueError):
            Email(invalide)


class TestEmailNormalisation:
    def test_met_en_minuscules(self) -> None:
        email = Email("User@StackNest.Local")

        assert email.value == "user@stacknest.local"

    def test_retire_les_espaces_de_bordure(self) -> None:
        email = Email("  user@stacknest.local  ")

        assert email.value == "user@stacknest.local"


class TestEmailValueObject:
    def test_est_immutable(self) -> None:
        email = Email("user@stacknest.local")

        with pytest.raises(Exception):  # noqa: B017 - FrozenInstanceError selon impl
            email.value = "autre@stacknest.local"  # type: ignore[misc]

    def test_egalite_par_valeur(self) -> None:
        assert Email("User@StackNest.Local") == Email("user@stacknest.local")

    def test_str_renvoie_la_valeur_normalisee(self) -> None:
        assert str(Email("User@Mail.com")) == "user@mail.com"
