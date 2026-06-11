"""Statuts possibles d'un service au sein d'une stack."""

from enum import StrEnum


class ServiceStatus(StrEnum):
    """Etat d'un service individuel dans une stack (niveau « service »).

    Enum propre a la slice stack plutot qu'une reutilisation de
    `DeploymentStatus` : un service de stack n'a pas (en v1) de cycle
    stop/start individuel (reporte en v2), et il porte un statut `partial`
    implicite via l'agregat au niveau stack. On garde donc un vocabulaire
    minimal aligne sur le provisioning compose.

    StrEnum : la valeur se serialise directement en chaine pour le stockage
    (colonne enum Postgres `service_status`) et l'API.

    - `pending`      : declare dans la stack, conteneur pas encore cree.
    - `provisioning` : conteneur en cours de creation (`compose up`).
    - `running`      : conteneur demarre, acces disponible.
    - `failed`       : echec de demarrage du service.
    - `destroyed`    : conteneur supprime (`compose down`).
    """

    PENDING = "pending"
    PROVISIONING = "provisioning"
    RUNNING = "running"
    FAILED = "failed"
    DESTROYED = "destroyed"
