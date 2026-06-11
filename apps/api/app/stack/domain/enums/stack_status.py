"""Statuts possibles d'une stack (machine a etats du cycle de vie global)."""

from enum import StrEnum


class StackStatus(StrEnum):
    """Etat global d'une stack dans son cycle de vie.

    Une stack agrege N services deployes comme un projet `docker compose`. Son
    statut est l'agregat des statuts de ses services (cf. design « Lifecycle 2
    niveaux ») :

        pending -> provisioning -> running / partial / failed
                                     |
                                     +--> destroying -> destroyed

    StrEnum : la valeur se serialise directement en chaine pour le stockage
    (colonne enum Postgres `stack_status`) et l'API.

    - `pending`      : stack creee en base, provisioning pas encore enfile/traite.
    - `provisioning` : le worker genere le compose-file et lance `compose up`.
    - `running`      : tous les services sont demarres.
    - `partial`      : certains services seulement sont demarres.
    - `failed`       : echec du provisioning (etat terminal cote job).
    - `destroying`   : `compose down` en cours.
    - `destroyed`    : stack supprimee (etat terminal).
    """

    PENDING = "pending"
    PROVISIONING = "provisioning"
    RUNNING = "running"
    PARTIAL = "partial"
    FAILED = "failed"
    DESTROYING = "destroying"
    DESTROYED = "destroyed"
