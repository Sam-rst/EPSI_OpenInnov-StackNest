"""Protocoles structurels d'une composition de stack, valides par le domaine.

Le `StackValidator` (domaine) doit verifier la structure d'une stack a creer
sans dependre de la couche application (regle de dependance : le domaine ne
connait pas l'application). On expose donc ici les *formes* minimales attendues
— un service porte un `alias`, un lien porte un `from_alias` et un `to_alias` —
sous forme de `Protocol`. La commande applicative `StackCreateCommand` (et ses
sous-commandes) satisfait structurellement ces protocoles : le use case passe
directement ses `services` / `links` au validateur, sans adaptateur ni import
inverse.
"""

from typing import Protocol


class ServiceComposition(Protocol):
    """Forme minimale d'un service vue par le validateur : son alias."""

    @property
    def alias(self) -> str: ...


class LinkComposition(Protocol):
    """Forme minimale d'un lien vue par le validateur : ses deux alias."""

    @property
    def from_alias(self) -> str: ...

    @property
    def to_alias(self) -> str: ...
