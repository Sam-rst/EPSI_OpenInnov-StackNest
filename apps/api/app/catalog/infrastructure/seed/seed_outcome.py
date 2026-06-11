"""Resultat d'une execution de seed du catalogue (compte insertions / mises a jour)."""

from dataclasses import dataclass


@dataclass(frozen=True)
class SeedOutcome:
    """Bilan d'un `CatalogSeeder.seed()` convergent.

    - `inserted` : templates absents en base, donc crees.
    - `updated`  : templates deja presents (meme slug), mis a jour en place pour
      refleter le seed (re-run sans changement = updates a 0 cout fonctionnel,
      mais comptes comme tels car le seeder rejoue l'etat cible).
    """

    inserted: int
    updated: int
