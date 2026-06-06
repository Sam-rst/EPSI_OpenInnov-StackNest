"""Schema de requete de demande de reinitialisation de mot de passe."""

from pydantic import BaseModel, Field


class ForgotRequest(BaseModel):
    """Corps de `POST /auth/forgot`."""

    email: str = Field(min_length=3, max_length=320)
