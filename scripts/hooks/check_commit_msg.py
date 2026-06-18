#!/usr/bin/env python
"""Valide le message de commit : Conventional Commit (français) + référence STN-XX.

Appelé par le hook git `commit-msg` (cf. .pre-commit-config.yaml). Reçoit en
argument le chemin du fichier contenant le message de commit. Bloque (exit 1) si
le sujet ne respecte pas le format ; encourage (warning, sans bloquer) la
référence `STN-XX` quand elle manque. Aucune dépendance externe (stdlib).

Format attendu :  <type>(<scope>)?!?: <description>
  type   : feat | fix | docs | chore | refactor | test | ci | build | perf | style | revert
  scope  : optionnel — idéalement `STN-XX` (p. ex. feat(STN-42): …)
"""

from __future__ import annotations

import re
import sys

TYPES = "feat|fix|docs|chore|refactor|test|ci|build|perf|style|revert"
SUBJECT_RE = re.compile(rf"^(?:{TYPES})(?:\([^)]+\))?!?: .+")
# Messages techniques tolérés tels quels (générés par git).
EXEMPT_PREFIXES = ("Merge ", "Revert ", "fixup!", "squash!")


def first_subject_line(raw: str) -> str:
    for line in raw.splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            return stripped
    return ""


def main() -> int:
    if len(sys.argv) < 2:
        print("check_commit_msg: chemin du message manquant.", file=sys.stderr)
        return 1

    subject = first_subject_line(open(sys.argv[1], encoding="utf-8").read())

    if subject.startswith(EXEMPT_PREFIXES):
        return 0

    if not SUBJECT_RE.match(subject):
        print(
            "\n❌ Message de commit non conforme (Conventional Commit).\n"
            f"   Reçu : {subject!r}\n"
            "   Attendu : <type>(<scope>)?: <description>\n"
            f"   Types : {TYPES.replace('|', ', ')}\n"
            "   Exemples : feat(STN-42): catalogue — filtre par tag\n"
            "              fix(STN-58): chat — ordre des messages\n",
            file=sys.stderr,
        )
        return 1

    if "STN-" not in subject:
        # Encouragé mais non bloquant : on rappelle la convention de traçabilité.
        print(
            "⚠️  Astuce : référence un ticket « STN-XX » dans le scope "
            "(ex. feat(STN-42): …) pour la traçabilité.",
            file=sys.stderr,
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
