"""Schema de requete de connexion."""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Corps de `POST /auth/login`."""

    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=256)
