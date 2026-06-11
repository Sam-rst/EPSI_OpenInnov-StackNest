"""Value object ComposeFile : projet docker-compose genere pour une stack."""

from dataclasses import dataclass


@dataclass(frozen=True)
class ComposeFile:
    """Compose-file genere pour une stack, prêt a etre materialise par le worker.

    Immutable : produit par le `ComposeBuilder` (domaine, testable en pur) puis
    transmis au `StackProvisioner` (infra) qui l'ecrit sur disque et lance
    `docker compose up -d`. Le domaine ne raisonne que sur cette specification,
    jamais sur la CLI Docker.

    Securite (cf. spec section « Securite ») : le YAML contient les secrets
    generes worker-side dans les blocs `environment` — il ne doit donc JAMAIS
    etre persiste ni loggue. Il vit le temps du `compose up` (fichier temporaire).

    - `project_name` : nom du projet compose (`stack_{id}`), isole les conteneurs.
    - `content`      : YAML complet du compose-file (services + reseau + liens).
    """

    project_name: str
    content: str

    def __post_init__(self) -> None:
        if not self.project_name.strip():
            raise ValueError("ComposeFile.project_name ne doit pas etre vide.")
        if not self.content.strip():
            raise ValueError("ComposeFile.content ne doit pas etre vide.")
