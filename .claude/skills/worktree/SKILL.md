---
name: worktree
description: Workflow worktree multi-agents StackNest (STN-156). Permet à plusieurs agents/devs de travailler en parallèle sur le même dépôt, chacun dans un git worktree isolé avec sa propre stack Docker (nom de projet Compose unique + ports décalés). Invoque ce skill quand l'utilisateur veut travailler en parallèle, lancer plusieurs stacks Docker en même temps, dit "worktree", "stack isolée", "bosser en parallèle", "deuxième environnement", "plusieurs agents", ou rencontre une collision de ports (port already allocated) / de nom de projet Compose.
---

# /worktree — Workflow worktree multi-agents

Outille le travail parallèle sur StackNest : chaque agent/dev obtient un worktree git isolé
(`.worktrees/<slug>`) doté de **sa propre stack Docker** — nom de projet Compose unique et 7 ports
décalés — pour qu'aucune stack n'écrase ni ne bloque une autre.

Spec : `docs/superpowers/specs/2026-06-04-worktree-convention.md`.

## Quand l'utiliser

- Deux agents/devs veulent coder en parallèle sans se gêner.
- Besoin de faire tourner deux stacks `docker compose up` simultanément.
- Collision de ports (`port is already allocated`) ou de nom de projet Compose.
- L'utilisateur dit "worktree", "stack isolée", "bosser en parallèle", "plusieurs agents".

## Concept

| Notion | Détail |
| --- | --- |
| Slot | Entier ≥ 1 attribué à un worktree (slot 0 = dépôt principal, ports par défaut) |
| Ports | `port = base + slot×100` sur 7 services (API, UI, Postgres, Redis, Mailhog SMTP/UI, Ollama) |
| Projet Docker | `stacknest-wt<slot>` (slot 0 → `stacknest`), exporté via `COMPOSE_PROJECT_NAME` dans le `.env` du worktree |
| Registre | `.worktrees/registry.json` (gitignored) — source de vérité des slots occupés |

## Commandes

Le script `scripts/worktree.sh` (bash, via WSL ou Git Bash) :

```bash
# Créer un worktree isolé depuis main (slot auto + .env + npm install + uv sync)
scripts/worktree.sh new feature/STN-XX-ma-feature

# Lister les worktrees enregistrés (slot, branche, projet, chemin)
scripts/worktree.sh list

# Afficher les 7 ports d'un worktree (par branche ou par slot)
scripts/worktree.sh ports feature/STN-XX-ma-feature
scripts/worktree.sh ports 2

# Supprimer un worktree et libérer son slot
scripts/worktree.sh rm feature/STN-XX-ma-feature
```

## Parcours type

1. Partir de `main` à jour.
2. `scripts/worktree.sh new feature/STN-XX-…` → slot attribué, worktree créé, `.env` généré, deps installées.
3. `cd .worktrees/<slug>` puis `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` → stack isolée.
4. Développer en TDD, commit (FR, référencer `STN-XX`), push, ouvrir la PR (squash merge).
5. Après merge : `scripts/worktree.sh rm feature/STN-XX-…` → worktree + slot libérés.

## Garde-fous

- **Aucun slot libre** → message d'erreur + suggestion de `rm` un worktree obsolète.
- **Branche déjà enregistrée** → refus.
- **`.worktrees/` non ignoré** → avertissement anti-commit accidentel (`git check-ignore`).
- **`rm` ne supprime pas la branche** (geste destructif laissé au dev) et **rappelle**
  `docker compose -p <projet> down -v` pour nettoyer la stack/les volumes.

## Notes

- Le slot 0 (dépôt principal) garde les ports par défaut, sans `.env` de worktree.
- Variables utiles : `WORKTREE_SKIP_INSTALL=1` (saute les installs), `WORKTREE_MAX_SLOTS`
  (défaut 9), `WORKTREE_BASE_REF` (défaut `main`).
- Test : `bash tests/infra/test_worktree.sh`.
- Windows natif hors WSL/Git Bash n'est pas supporté (script bash).
