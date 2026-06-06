"""Value object Password : mot de passe en clair valide par la politique de robustesse."""

from dataclasses import dataclass

_MIN_LENGTH = 8


@dataclass(frozen=True)
class Password:
    """Mot de passe EN CLAIR, valide a la construction (politique de robustesse).

    Politique MVP : au moins 8 caracteres et au moins un chiffre. Ce VO ne
    stocke jamais le hash : il porte le secret le temps de le confier au
    `PasswordHasher`. `__str__`/`__repr__` masquent la valeur pour eviter toute
    fuite dans les logs ou les traces.
    """

    value: str

    def __post_init__(self) -> None:
        if len(self.value) < _MIN_LENGTH:
            raise ValueError(f"Le mot de passe doit faire au moins {_MIN_LENGTH} caracteres.")
        if not any(character.isdigit() for character in self.value):
            raise ValueError("Le mot de passe doit contenir au moins un chiffre.")

    def __str__(self) -> str:
        return "***"

    def __repr__(self) -> str:
        return "Password(value='***')"
