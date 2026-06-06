"""Finalites possibles d'un jeton JWT emis par la plateforme."""

from enum import StrEnum


class TokenPurpose(StrEnum):
    """Usage d'un JWT, porte par le claim `purpose`.

    Cloisonner les jetons par finalite empeche d'utiliser un jeton dans un
    contexte non prevu (ex : un jeton de reset de mot de passe ne doit jamais
    authentifier une requete API). Le `TokenService` rejette tout jeton dont
    le `purpose` ne correspond pas a celui attendu.

    - `ACCESS`  : authentifie les requetes API (courte duree)
    - `REFRESH` : permet d'obtenir un nouvel access token (longue duree, cookie)
    - `VERIFY`  : lien de verification d'adresse email
    - `RESET`   : lien de reinitialisation de mot de passe
    """

    ACCESS = "access"
    REFRESH = "refresh"
    VERIFY = "verify"
    RESET = "reset"
