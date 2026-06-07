"""Types de jobs asynchrones traites par le worker de deploiement."""

from enum import StrEnum


class JobKind(StrEnum):
    """Nature d'un job de deploiement enfile vers le worker (cf. design section 6).

    Chaque action de cycle de vie produit un job d'un de ces types, consomme par
    la boucle worker `arq`. StrEnum : la valeur se serialise directement pour le
    transport dans la file Redis.

    - `provision`  : pull image + creation/run du conteneur (PROVISION).
    - `stop`       : arret du conteneur (running -> stopped).
    - `start`      : redemarrage du conteneur (stopped -> running).
    - `destroy`    : suppression du conteneur + cleanup.
    - `regenerate` : regeneration du secret (recree le conteneur — cf. risques).
    """

    PROVISION = "provision"
    STOP = "stop"
    START = "start"
    DESTROY = "destroy"
    REGENERATE = "regenerate"
