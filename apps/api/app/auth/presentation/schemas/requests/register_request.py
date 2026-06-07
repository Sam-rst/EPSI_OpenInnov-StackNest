"""Schema de requete d'inscription."""

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    """Corps de `POST /auth/register`.

    La validation metier fine (format email, robustesse du mot de passe) est
    portee par les value objects du domaine ; le schema se contente d'imposer la
    presence des champs et des bornes de longueur defensives (anti-DoS).
    """

    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=256)
