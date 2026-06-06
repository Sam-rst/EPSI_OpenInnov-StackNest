"""Categories possibles d'un template du catalogue."""

from enum import StrEnum


class TemplateCategory(StrEnum):
    """Categorie d'un template (regroupe les ressources par nature).

    Sert de filtre dans le catalogue et de type Postgres `template_category`.
    """

    DATABASE = "database"
    CACHE = "cache"
    RUNTIME = "runtime"
    STORAGE = "storage"
    VM = "vm"
    NETWORK = "network"
    OBSERVABILITY = "observability"
    SECURITY = "security"
    AI = "ai"
