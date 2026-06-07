"""Tests unitaires du value object Slug (validation + normalisation)."""

import pytest

from app.catalog.domain.value_objects.slug import Slug


class TestSlugValide:
    def test_slug_simple_minuscule(self) -> None:
        assert Slug("postgresql").value == "postgresql"

    def test_slug_avec_chiffres_et_tirets(self) -> None:
        assert Slug("postgresql-16").value == "postgresql-16"

    def test_normalise_les_majuscules_et_espaces(self) -> None:
        assert Slug("  Node-20  ").value == "node-20"

    def test_str_renvoie_la_valeur(self) -> None:
        assert str(Slug("redis-7")) == "redis-7"

    def test_egalite_par_valeur(self) -> None:
        assert Slug("vault") == Slug("Vault")


class TestSlugInvalide:
    def test_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            Slug("")

    def test_espaces_seuls_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            Slug("   ")

    def test_caracteres_interdits_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            Slug("Postgre SQL!")

    def test_underscore_interdit(self) -> None:
        with pytest.raises(ValueError):
            Slug("node_20")

    def test_tiret_en_debut_interdit(self) -> None:
        with pytest.raises(ValueError):
            Slug("-node")

    def test_tiret_en_fin_interdit(self) -> None:
        with pytest.raises(ValueError):
            Slug("node-")
