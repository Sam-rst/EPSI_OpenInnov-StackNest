"""Value object Email : adresse email validee et normalisee."""

import re
from dataclasses import dataclass

# Validation pragmatique (pas la RFC 5322 complete) : une partie locale sans
# espace, un @, un domaine avec au moins un point. Suffisant pour rejeter les
# saisies grossierement invalides ; la verification reelle reste l'envoi d'un
# email de confirmation.
_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@dataclass(frozen=True)
class Email:
    """Adresse email d'un utilisateur, normalisee en minuscules et sans espaces.

    Immutable (frozen) : un Email valide reste valide. La normalisation
    (`strip()` + `lower()`) garantit l'unicite cote base (un seul compte par
    adresse, insensible a la casse). Guard clause : format invalide -> ValueError.
    """

    value: str

    def __post_init__(self) -> None:
        normalized = self.value.strip().lower()
        if not _EMAIL_PATTERN.match(normalized):
            raise ValueError(f"Adresse email invalide : {self.value!r}")
        object.__setattr__(self, "value", normalized)

    def __str__(self) -> str:
        return self.value
