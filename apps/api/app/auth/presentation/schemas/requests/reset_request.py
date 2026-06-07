"""Schema de requete de reinitialisation de mot de passe."""

from pydantic import BaseModel, Field


class ResetRequest(BaseModel):
    """Corps de `POST /auth/reset`.

    `token` est le jeton de finalite `reset` issu du lien email ; `password` est
    le nouveau mot de passe (valide par le value object Password cote domaine).
    """

    token: str = Field(min_length=1, max_length=4096)
    password: str = Field(min_length=1, max_length=256)
