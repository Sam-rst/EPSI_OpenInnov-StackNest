"""Tests unitaires de l'entite TemplateVersion (guards metier)."""

from datetime import date
from uuid import uuid4

import pytest

from app.catalog.domain.entities.template_version import TemplateVersion


def _version(**overrides: object) -> TemplateVersion:
    params: dict[str, object] = {
        "id": uuid4(),
        "version": "16",
        "is_default": True,
        "is_lts": False,
        "eol_date": date(2028, 11, 9),
    }
    params.update(overrides)
    return TemplateVersion(**params)  # type: ignore[arg-type]


class TestTemplateVersionValide:
    def test_construction_nominale(self) -> None:
        version = _version()

        assert version.version == "16"
        assert version.is_default is True

    def test_eol_date_optionnelle(self) -> None:
        assert _version(eol_date=None).eol_date is None


class TestTemplateVersionGuards:
    def test_version_vide_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _version(version="")

    def test_version_espaces_seuls_leve_value_error(self) -> None:
        with pytest.raises(ValueError):
            _version(version="   ")
