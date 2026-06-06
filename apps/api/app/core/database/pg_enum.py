"""Fabrique de type colonne Enum Postgres a partir d'un StrEnum.

Par defaut, SQLAlchemy materialise un type enum Postgres en utilisant les NOMS
des membres Python (`USER`, `ADMIN`), pas leurs valeurs (`user`, `admin`). Or
le code metier (server_default, lectures/ecritures) raisonne sur les valeurs.

`pg_enum` force l'usage des valeurs via `values_callable`, garantissant que les
labels stockes en base correspondent aux `.value` du StrEnum.
"""

from enum import StrEnum

from sqlalchemy import Enum


def pg_enum(enum_type: type[StrEnum], *, name: str) -> Enum:
    """Construit un type colonne Enum Postgres etiquete sur les valeurs du StrEnum."""
    return Enum(
        enum_type,
        name=name,
        values_callable=lambda members: [member.value for member in members],
    )
