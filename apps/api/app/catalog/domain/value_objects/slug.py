"""Value object Slug : identifiant lisible et stable d'un template."""

import re
from dataclasses import dataclass

# Slug DNS-friendly : suite de groupes alphanumériques minuscules séparés par
# un unique tiret (jamais en début/fin, jamais doublé). Les classes de
# caractères sont disjointes et le motif est ancré sans alternance imbriquée :
# linéaire, aucun backtracking polynomial (S5852 / ReDoS).
_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


@dataclass(frozen=True)
class Slug:
    """Identifiant lisible et unique d'un template (utilise dans les URLs).

    Immutable (frozen) : un slug valide reste valide. La normalisation
    (`strip()` + `lower()`) garantit l'unicite cote base, insensible a la casse
    et aux espaces de saisie. Guard clause : format invalide -> ValueError.
    """

    value: str

    def __post_init__(self) -> None:
        normalized = self.value.strip().lower()
        if not _SLUG_PATTERN.match(normalized):
            raise ValueError(f"Slug invalide : {self.value!r}")
        object.__setattr__(self, "value", normalized)

    def __str__(self) -> str:
        return self.value
