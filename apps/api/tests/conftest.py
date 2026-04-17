"""Configuration globale pytest pour l'API StackNest.

Conventions de nommage des tests :
- tests/unit/        -> *.unit.py    (rapides, pas d'I/O, mocks uniquement)
- tests/integration/ -> *.integ.py   (testcontainers, DB/Redis reels)
- tests/e2e/         -> *.e2e.py     (stack complet)
"""
