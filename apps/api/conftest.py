"""Configuration globale pytest pour l'API StackNest.

Les tests vivent co-located avec le code qu'ils testent, dans des dossiers
`__tests__/unit/` et `__tests__/integration/` repartis dans l'arbre `app/`.
Les tests E2E cross-feature restent dans `tests/e2e/scenarios/`.

Conventions de nommage (le suffixe est la source de verite du niveau) :
- test_*.unit.py   -> rapides, pas d'I/O, mocks uniquement
- test_*.integ.py  -> un adapter reel (DB via testcontainers, ASGI in-process)
- test_*.e2e.py    -> stack complet sur TCP

Le hook ci-dessous applique automatiquement le marker correspondant au
suffixe, ce qui permet `pytest -m unit` / `-m integ` / `-m e2e` partout.
"""

import pytest

_LEVEL_BY_SUFFIX = {".unit.py": "unit", ".integ.py": "integ", ".e2e.py": "e2e"}


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    for item in items:
        filename = item.path.name
        for suffix, marker in _LEVEL_BY_SUFFIX.items():
            if filename.endswith(suffix):
                item.add_marker(marker)
                break
