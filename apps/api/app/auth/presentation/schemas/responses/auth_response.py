"""Schema de reponse d'authentification (access token + utilisateur)."""

from pydantic import BaseModel

from app.auth.presentation.schemas.responses.user_response import UserResponse


class AuthResponse(BaseModel):
    """Reponse de `POST /auth/login` : access token (body) + utilisateur.

    Le refresh token n'apparait pas ici : il voyage dans un cookie httpOnly
    (`Set-Cookie`), inaccessible au JavaScript (mitigation XSS).
    """

    access_token: str
    user: UserResponse
