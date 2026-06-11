"""Types de jobs asynchrones traites par le worker de stack (compose)."""

from enum import StrEnum


class StackJobKind(StrEnum):
    """Nature d'un job de stack enfile vers le worker (cf. spec « Provisioning »).

    Chaque action de cycle de vie d'une stack produit un job d'un de ces types,
    consomme par la boucle worker `arq` dediee aux stacks. StrEnum : la valeur se
    serialise directement pour le transport dans la file Redis (sans donnee
    metier ni secret).

    - `provision` : genere le compose-file + `docker compose up -d` (PROVISION).
    - `destroy`   : `docker compose down -v` (DESTROY).
    """

    PROVISION = "provision"
    DESTROY = "destroy"
