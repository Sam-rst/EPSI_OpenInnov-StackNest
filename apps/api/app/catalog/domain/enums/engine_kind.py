"""Moteur de provisioning possible d'un template du catalogue."""

from enum import StrEnum


class EngineKind(StrEnum):
    """Moteur qui provisionne une ressource du catalogue (discriminateur).

    Pilote la feature deploiement : un template `DOCKER` est materialise par un
    conteneur (via son descripteur image/port/secret), un template `TERRAFORM`
    par un plan d'infrastructure (VM, reseau, bucket...). Sert de type Postgres
    `engine_kind`.

    - `DOCKER`    : conteneur Docker (defaut).
    - `TERRAFORM` : ressource provisionnee par un plan Terraform.
    """

    DOCKER = "docker"
    TERRAFORM = "terraform"
