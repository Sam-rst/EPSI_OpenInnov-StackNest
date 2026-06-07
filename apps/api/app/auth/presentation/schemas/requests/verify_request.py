"""Schema de requete de verification d'adresse email."""

from pydantic import BaseModel, Field


class VerifyRequest(BaseModel):
    """Corps de `POST /auth/verify` : le jeton de finalite `verify` du lien email."""

    token: str = Field(min_length=1, max_length=4096)
