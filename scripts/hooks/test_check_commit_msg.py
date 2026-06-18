"""Tests du validateur de message de commit (hook git `commit-msg`).

Le script `check_commit_msg.py` est un outil racine (hors stack api/web) : on le
teste donc depuis la suite *tooling* racine (`uv run poe test`). On charge le
module par chemin (pas de package) puis on exerce le parsing, la regex et `main`.
"""

from __future__ import annotations

import importlib.util
import pathlib
import sys

import pytest

_SCRIPT = pathlib.Path(__file__).parent / "check_commit_msg.py"
_spec = importlib.util.spec_from_file_location("check_commit_msg", _SCRIPT)
assert _spec and _spec.loader
ccm = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ccm)


def _run(message: str, tmp_path: pathlib.Path, monkeypatch: pytest.MonkeyPatch) -> int:
    msg_file = tmp_path / "COMMIT_EDITMSG"
    msg_file.write_text(message, encoding="utf-8")
    monkeypatch.setattr(sys, "argv", ["check_commit_msg.py", str(msg_file)])
    return ccm.main()


class TestFirstSubjectLine:
    def test_ignore_commentaires_et_lignes_vides(self) -> None:
        raw = "\n# commentaire git\n\nfeat(STN-1): sujet\ncorps du message\n"
        assert ccm.first_subject_line(raw) == "feat(STN-1): sujet"

    def test_message_sans_sujet_retourne_vide(self) -> None:
        assert ccm.first_subject_line("\n# uniquement un commentaire\n") == ""


class TestMessagesValides:
    @pytest.mark.parametrize(
        "subject",
        [
            "feat(STN-42): catalogue — filtre par tag",
            "fix(STN-58): chat — ordre des messages",
            "docs(STN-170): dossier de rendu",
            "chore: bump version",  # scope optionnel
            "refactor(core): extrait le mapper",
            "ci(securite): durcir la CI",  # scope non-STN toléré
            "feat(STN-1)!: breaking change",  # ! APRÈS le scope (Conventional Commit)
            "fix!: breaking sans scope",
        ],
    )
    def test_accepte_les_sujets_conformes(self, subject, tmp_path, monkeypatch) -> None:
        assert _run(subject, tmp_path, monkeypatch) == 0


class TestMessagesInvalides:
    @pytest.mark.parametrize(
        "subject",
        [
            "mon commit sans convention",
            "STN-42: pas de type conventionnel",
            "Feature(STN-1): mauvaise casse de type",
            "feat STN-1 sans deux-points",
            "feat!(STN-1): bang mal placé avant le scope",  # forme non standard
            "",
        ],
    )
    def test_rejette_les_sujets_non_conformes(self, subject, tmp_path, monkeypatch) -> None:
        assert _run(subject, tmp_path, monkeypatch) == 1


class TestExemptions:
    @pytest.mark.parametrize(
        "subject",
        ["Merge branch 'main' into feature/x", "Revert \"feat: x\"", "fixup! feat: x", "squash! fix: y"],
    )
    def test_messages_techniques_git_toleres(self, subject, tmp_path, monkeypatch) -> None:
        assert _run(subject, tmp_path, monkeypatch) == 0


class TestRappelStn:
    def test_sujet_valide_sans_stn_passe_mais_avertit(self, tmp_path, monkeypatch, capsys) -> None:
        assert _run("chore: tache sans ticket", tmp_path, monkeypatch) == 0
        assert "STN-" in capsys.readouterr().err  # rappel non bloquant sur stderr

    def test_sujet_avec_stn_aucun_avertissement(self, tmp_path, monkeypatch, capsys) -> None:
        assert _run("feat(STN-9): avec ticket", tmp_path, monkeypatch) == 0
        assert "Astuce" not in capsys.readouterr().err


class TestArgumentManquant:
    def test_sans_chemin_retourne_erreur(self, monkeypatch) -> None:
        monkeypatch.setattr(sys, "argv", ["check_commit_msg.py"])
        assert ccm.main() == 1
