"""Statuts possibles d'un deploiement (machine a etats du cycle de vie)."""

from enum import StrEnum


class DeploymentStatus(StrEnum):
    """Etat d'un deploiement dans son cycle de vie.

    Machine a etats (cf. design section 7) :

        pending -> provisioning -> running <-> stopped
                                     |          |
                                     +----------+--> destroying -> destroyed
        (toute etape) ------------------------------------------> failed

    StrEnum : la valeur se serialise directement en chaine pour le stockage
    (colonne enum Postgres `deployment_status`) et l'API.

    - `pending`      : cree en base, job de provisioning pas encore traite.
    - `provisioning` : le worker pull l'image et lance le conteneur.
    - `running`      : conteneur demarre, acces disponible.
    - `stopped`      : conteneur arrete (conserve, redemarrable).
    - `failed`       : echec a une etape quelconque (etat terminal cote job).
    - `destroying`   : suppression du conteneur en cours.
    - `destroyed`    : ressource supprimee (etat terminal).
    """

    PENDING = "pending"
    PROVISIONING = "provisioning"
    RUNNING = "running"
    STOPPED = "stopped"
    FAILED = "failed"
    DESTROYING = "destroying"
    DESTROYED = "destroyed"
