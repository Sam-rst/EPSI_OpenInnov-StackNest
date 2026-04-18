"""Schema de reponse de l'endpoint GET /version."""

from pydantic import BaseModel, Field


class VersionResponse(BaseModel):
    """Metadonnees de build et de deploiement de l'API.

    Les valeurs sont injectees au build par la CI (ARG Docker) puis lues au
    runtime depuis les variables d'environnement via `pydantic-settings`.
    Sans injection, les defaults renvoient des valeurs de dev (`0.0.0-dev`).
    """

    version: str = Field(
        ...,
        description="Version applicative (SemVer). Injectee au build par la CI "
        "depuis `version.json` a la racine du repo.",
        examples=["0.1.0-rc.1", "0.2.0"],
    )
    commit: str = Field(
        ...,
        description="SHA court du commit deploye. Injecte au build par la CI "
        "via `git rev-parse --short HEAD`.",
        examples=["abc1234"],
    )
    env: str = Field(
        ...,
        description="Environnement d'execution.",
        examples=["dev", "test", "preview", "prod"],
    )
    deployed_at: str = Field(
        ...,
        description="Timestamp ISO 8601 UTC du deploiement. Injecte au build.",
        examples=["2026-04-18T12:00:00Z"],
    )
