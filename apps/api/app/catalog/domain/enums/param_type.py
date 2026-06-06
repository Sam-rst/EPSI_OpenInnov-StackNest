"""Types possibles d'un parametre de template."""

from enum import StrEnum


class ParamType(StrEnum):
    """Type d'un parametre de provisioning d'un template.

    Pilote le rendu du formulaire cote UI et la validation cote API. Sert de
    type Postgres `param_type`.

    - `STRING` : champ texte libre
    - `INT`    : entier
    - `BOOL`   : case a cocher
    - `SELECT` : liste de choix (voir colonne `options`)
    - `SECRET` : valeur sensible (masquee, jamais reaffichee)
    """

    STRING = "string"
    INT = "int"
    BOOL = "bool"
    SELECT = "select"
    SECRET = "secret"
