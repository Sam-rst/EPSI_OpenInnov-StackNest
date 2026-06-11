"""Tests unitaires du value object ComposeFile (garde-fous de non-vacuite)."""

import pytest

from app.stack.domain.value_objects.compose_file import ComposeFile


class TestComposeFile:
    def test_construit_un_compose_file_valide(self) -> None:
        compose = ComposeFile(project_name="stack_abc", content="services: {}")

        assert compose.project_name == "stack_abc"
        assert compose.content == "services: {}"

    def test_rejette_un_nom_de_projet_vide(self) -> None:
        with pytest.raises(ValueError, match="project_name"):
            ComposeFile(project_name="  ", content="services: {}")

    def test_rejette_un_contenu_vide(self) -> None:
        with pytest.raises(ValueError, match="content"):
            ComposeFile(project_name="stack_abc", content="   ")
