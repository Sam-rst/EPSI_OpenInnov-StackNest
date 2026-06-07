"""Schema de reponse d'un access token seul (refresh)."""

from pydantic import BaseModel


class AccessTokenResponse(BaseModel):
    """Reponse de `POST /auth/refresh` : seulement le nouvel access token.

    Le nouveau refresh token est repose dans le cookie httpOnly (rotation), il
    n'apparait donc pas dans le body.
    """

    access_token: str
