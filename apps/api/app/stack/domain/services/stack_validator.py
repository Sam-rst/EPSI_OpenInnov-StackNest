"""Service de domaine : validation structurelle d'une composition de stack."""

from collections.abc import Sequence

from app.stack.domain.exceptions.invalid_stack import InvalidStackException
from app.stack.domain.services.stack_composition import (
    LinkComposition,
    ServiceComposition,
)

_MIN_SERVICES = 1


class StackValidator:
    """Garantit les invariants metier d'une stack composable avant persistance.

    Source de verite des regles structurelles (cf. design, section « Validation ») :

    1. au moins un service ;
    2. alias non vides et uniques au sein de la stack (cle compose / DNS interne) ;
    3. chaque lien reference des alias existants, et un service ne se lie pas a
       lui-meme (`from != to`) ;
    4. le graphe des liens est acyclique (`depends_on` ne doit pas boucler).

    Toute violation leve `InvalidStackException` (HTTP 422), levee au premier ecart
    constate : aucune stack invalide n'est persistee ni enfilee. Le validateur ne
    depend que de formes structurelles (`ServiceComposition` / `LinkComposition`,
    cf. `stack_composition`) : la commande applicative les satisfait sans import
    inverse vers l'application.
    """

    def validate(
        self,
        services: Sequence[ServiceComposition],
        links: Sequence[LinkComposition],
    ) -> None:
        """Verifie services puis liens ; leve au premier invariant enfreint."""
        self._validate_services(services)
        aliases = {service.alias for service in services}
        self._validate_links(links, aliases)
        self._ensure_acyclic(links)

    def _validate_services(self, services: Sequence[ServiceComposition]) -> None:
        if len(services) < _MIN_SERVICES:
            raise InvalidStackException("Une stack doit comporter au moins un service.")
        seen: set[str] = set()
        for service in services:
            if not service.alias.strip():
                raise InvalidStackException("L'alias d'un service ne doit pas etre vide.")
            if service.alias in seen:
                raise InvalidStackException(
                    f"L'alias « {service.alias} » est utilise par plusieurs services."
                )
            seen.add(service.alias)

    def _validate_links(self, links: Sequence[LinkComposition], aliases: set[str]) -> None:
        for link in links:
            if link.from_alias not in aliases:
                raise InvalidStackException(
                    f"Le lien reference un service consommateur inconnu : « {link.from_alias} »."
                )
            if link.to_alias not in aliases:
                raise InvalidStackException(
                    f"Le lien reference un service fournisseur inconnu : « {link.to_alias} »."
                )
            if link.from_alias == link.to_alias:
                raise InvalidStackException(
                    f"Le service « {link.from_alias} » ne peut pas se lier a lui-meme."
                )

    def _ensure_acyclic(self, links: Sequence[LinkComposition]) -> None:
        """Detecte un cycle dans le graphe dirige des liens (DFS coloriage)."""
        adjacency: dict[str, list[str]] = {}
        for link in links:
            adjacency.setdefault(link.from_alias, []).append(link.to_alias)

        visiting: set[str] = set()
        visited: set[str] = set()

        def has_cycle(node: str) -> bool:
            visiting.add(node)
            for neighbour in adjacency.get(node, []):
                if neighbour in visiting:
                    return True
                if neighbour not in visited and has_cycle(neighbour):
                    return True
            visiting.discard(node)
            visited.add(node)
            return False

        for node in adjacency:
            if node not in visited and has_cycle(node):
                raise InvalidStackException(
                    "Le graphe des liens contient un cycle (dependances circulaires)."
                )
