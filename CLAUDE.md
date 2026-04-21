# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🤖 Session Claude Code — Démarrage rapide (à exécuter à chaque nouvelle session)

**IMPORTANT** : si tu démarres dans ce repo (notamment après un `git clone` sur une nouvelle machine / nouveau dossier), tu n'as probablement PAS de mémoire utilisateur (elle est stockée par chemin absolu dans `~/.claude/projects/<hash>/memory/`). Suis ce protocole :

1. **Annonce à l'utilisateur** en 1 phrase : "Je démarre dans StackNest (IDP FastAPI + React). Je vais chercher le prochain ticket à bosser."
2. **Invoke le skill `/next-task`** pour identifier le prochain ticket Jira à prendre (Prêt, priorité la plus haute, non bloqué, pas `attente-maquette`, prérequis terminés).
3. **Vérifie l'état git** : branche courante, état working tree. Si sur `main`, créer `feature/STN-XX-slug` avant de toucher au code.
4. **Rappel conventions projet** (à connaître par coeur — pas besoin de les relire à chaque fois, sont ci-dessous) :
   - TDD strict Red → Green → Blue (skill `/TDD`)
   - Commits en français, référencer `STN-XX`
   - 1 fichier = 1 classe (backend), 1 fichier = 1 composant (frontend)
   - Clean Archi vertical slicing : `domain/` → `application/` → `infrastructure/` + `presentation/`
   - Branches `feature/STN-XX-description`, merge via PR vers `main`
5. **Attends la validation user** avant de `git checkout -b`, coder, ou modifier du code.

Le skill `/next-task` est committé dans `.claude/skills/next-task/` donc il voyage avec le repo — dispo dans chaque clone.

## Project Overview

StackNest is an Internal Developer Platform (IDP) that enables technical teams to provision IT resources (VMs, databases, environments) autonomously via a web UI or an AI chatbot, using Terraform and Docker.

The entire UI is in **French** — all labels, text, and user-facing strings must remain in French.
Commits must be in **French** and reference the Jira ticket (**STN-XX**, pas `EOS-XX`).

## Team

- **Dev** : Samuel Ressiot (tech lead), Yassine Zouitni (M1 DEV)
- **Cyber** : Antony Lozano, Remi Reze, Thomas Bremard (M1 CYBER)
- **Design/QA** : Julien Volmerange, Mahe Pernot (B1)

## Tech Stack

- **Backend** : FastAPI (Python 3.13), uv, Clean Architecture vertical slicing
- **Frontend** : React + Vite + TypeScript (SPA), Tailwind CSS
- **Database** : PostgreSQL 16, SQLAlchemy async + Alembic
- **IaC** : Terraform (Docker provider MVP, Proxmox stretch)
- **Queue/Realtime** : Redis (job queue + pub/sub SSE)
- **LLM** : Pluggable — Ollama (default) / OpenAI (fallback)
- **Infra** : Docker Compose, VM Proxmox (serveur Antony), VPN access
- **CI** : GitHub Actions (cloud runner)
- **CD** : Self-hosted GitHub Actions runner on Antony's server
- **Monitoring** : Sentry (back + front), structlog JSON (logs)
- **Pre-commit** : Husky + lint-staged

## Architecture

### Monorepo modulaire

```
stacknest/
├── apps/
│   ├── api/          # FastAPI backend
│   ├── web/          # React + Vite (web app)
│   └── worker/       # Worker Terraform
├── infra/
│   ├── docker/       # docker-compose.{yml,dev,test,preview,prod}.yml
│   ├── terraform/    # environments/ + modules/
│   └── scripts/      # env.sh (start/stop envs)
├── .github/workflows/ # ci.yml, cd.yml, security.yml, performance.yml
├── configs/          # semgrep, spectral, checkov, k6
├── docs/
├── package.json      # Root — husky, lint-staged
└── version.json      # SemVer centralisee
```

### Docker Compose Services

| Service | Role |
|---|---|
| **ui** (Nginx) | SPA React, reverse-proxy `/api/` vers API |
| **api** (FastAPI) | Logique metier, auth, catalogue, orchestration |
| **worker** (Python + Terraform) | Execute les plans Terraform, isole du web |
| **db** (PostgreSQL 16) | Users, catalogue, deploiements, conversations |
| **redis** (Redis 7) | Queue jobs API→Worker + pub/sub SSE |
| **ollama** (optionnel) | LLM local |

### Backend — Clean Architecture + Vertical Slicing

```
apps/api/app/
├── core/                    # Config, BDD, Redis, securite, deps partagees
├── auth/                    # domain/ application/ infrastructure/ presentation/
├── catalog/                 # domain/ application/ infrastructure/ presentation/
├── deployment/              # domain/ application/ infrastructure/ presentation/ worker/
├── chat/                    # domain/ application/ infrastructure/ presentation/
├── dashboard/               # domain/ application/ infrastructure/ presentation/
├── main.py                  # Entrypoint API
└── worker_main.py           # Entrypoint Worker
```

Each feature has its own domain/application/infrastructure/presentation layers. Features depend only on `core/` and communicate via domain interfaces.

**1 fichier = 1 classe.** Domain: entities/, value_objects/, enums/, interfaces/, exceptions/, factories/. Infrastructure: models/, repositories/, mappers/. Presentation: schemas/.

### Frontend — Feature-Sliced + Clean Architecture par feature

```
apps/web/src/
├── core/                    # Coeur du projet : bootstrap, router, config, layout shell, client API, sentry
├── shared/                  # Code utilise par >=2 features (clean archi : components/, hooks/, services/, types/, pages/...)
├── <feature>/               # Feature isolee (clean archi : contexts/, providers/, hooks/, pages/, services/, types/, mappers/, components/...)
└── main.tsx
```

**Regles de placement :**
- **Feature-specifique** → `<feature>/` (ex: `auth/contexts/AuthContext.ts`, `auth/pages/LoginPage.tsx`, `catalog/services/templateService.ts`)
- **Commun a >=2 features** → `shared/` (ex: `shared/components/ProtectedRoute.tsx` consomme par toutes les routes protegees, `shared/pages/NotFoundPage.tsx` fallback generique)
- **Bootstrap/shell du projet** → `core/` (ex: `core/router.tsx`, `core/layout/AppLayout.tsx`, `core/api/axios-instance.ts`, `core/sentry.ts`)

**1 fichier = 1 composant.** Types: dto/ + models/ + enums/ + guards/. Separation DTO (miroir API) / Model (UI enrichi) avec mappers. Compound components quand > 100 lignes.

**Ne pas pre-creer les dossiers de features vides** — mais il est legitime de creer `<feature>/pages/PlaceholderPage.tsx` depuis le ticket qui pose le routing (ex: STN-21). Le dossier grossit au fil des tickets feature suivants. Idem cote backend dans `apps/api/app/`.

**Anti-pattern : mettre la logique d'une feature dans `core/`.** L'AuthContext appartient a `auth/`, pas a `core/`. Le core ne contient que le bootstrap du projet.

## Skills

- **`/ba`** — Orchestrate the full lifecycle of a Jira ticket from idea to "Prêt". ALWAYS invoke this skill before creating any ticket (feature, bug, task). The BA drives a 13-step process: create skeleton → brainstorm (with `superpowers:brainstorming`) → optional design (with `frontend-design` or `figma`) → write full DOR → link dependencies → estimate with complexity matrix → user validates. Never write a DOR without brainstorming first. Every ticket must have 6 sections: Contexte, Criteres d'acceptation (min 3, Given/When/Then), Parcours utilisateur, Perimetre, Impact technique, Risques et dependances, Scenarios de test.

## Methodology

### TDD strict (Red → Green → Blue)

1. **RED** : write failing tests (unit + integration + E2E)
2. **GREEN** : minimum implementation to pass
3. **BLUE** : refactor (Software Craftsmanship)

### Software Craftsmanship (Blue phase)

- Explicit naming (no abbreviations)
- Functions <= 20 lines, single responsibility
- Early return, named constants (Enums, not magic strings), structured logs (structlog JSON)
- Custom typed exceptions (DomainException with code + message)
- Try/catch on infrastructure only (network, DB, timers). Handler global DomainException → HTTP.
- Value Objects (frozen dataclass) for types with business validation
- Guard clauses in entities (__post_init__)
- Factories for complex entity creation

### Validation order

Code → Green tests → Lint (0 errors, 0 warnings) → Docs → Commit

**Strict lint** : `eslint --max-warnings 0` (tout warning casse la CI). Frontend utilise `typescript-eslint/strict` + `typescript-eslint/stylistic`. Prettier `--check` fait autorité sur le format (CRLF interdit, endOfLine=lf).

**Scripts npm standardisés (frontend)** : `lint` / `lint:fix` / `format:check` / `format:write` (alias de `format`) / `typecheck` / `test` / `test:unit` / `test:integ` / `test:watch` / `test:coverage` / `e2e` / `test:mutation` / `build`. `test:unit` et `test:integ` filtrent via suffixe du nom de fichier (`*.unit.test.{ts,tsx}` / `*.integ.test.{ts,tsx}`), pattern déjà configuré dans `vitest.config.ts` (`include`).

### Test coverage

- **80% global minimum**, **90% on business logic**
- 3 levels: unit (.unit.), integration (.integ.), E2E (.e2e.)
- **Tests unit/integ colocalisés** dans `__tests__/{unit,integration}/` à côté du code (convention unifiée back + front). **E2E** dans `tests/e2e/scenarios/` (backend) ou `apps/web/tests/e2e/` (frontend) car cross-feature par nature.
- Backend: pytest + testcontainers. Auto-marker pytest (via `conftest.py` racine) qui applique `@pytest.mark.{unit,integ,e2e}` selon le suffixe du fichier (`*.unit.py` / `*.integ.py` / `*.e2e.py`). Commandes : `uv run pytest -m unit` (boucle TDD rapide), `-m integ`, `-m e2e`, ou `uv run pytest app/{feature}/` pour un slice vertical.
- Frontend: vitest + MSW + Playwright.

## Trunk-Based Development (TBD)

- **main** (trunk) : always deployable, everything goes through PRs
- **feature/STN-XX-description** : short-lived (<2 days), created from main
- **hotfix/STN-XX-description** : critical prod fix, merge to main + tag patch
- Never add `Co-Authored-By`
- Pre-commit: Husky + lint-staged (auto lint/format)
- CI is automatic (push/PR). **CD is ALWAYS manual** (workflow_dispatch).

### PR conventions

- **Titre** : `STN-XX — [Domaine] Description courte` (FR, <70 caracteres)
- **Body** : sections obligatoires — `Résumé`, `Changements principaux`, `Validation (déjà exécutée)` (table des checks locaux), `Critères d'acceptation` (checklist copiée du ticket), `Plan de test (reviewer)`
- **Plan de test actionnable** : chaque étape DOIT contenir les commandes exactes à copier-coller (pas juste une description). Inclure : prérequis, récupération de la branche, checks locaux, étapes de validation UI avec URL, tests E2E/mutation si applicable, build Docker si applicable, nettoyage. But : le reviewer ne doit pas avoir à deviner comment tester.
- Utiliser `gh pr create --base main` (gh.exe dans `/c/Program Files/GitHub CLI/`, préfixer PATH si bash). Ne jamais ajouter `Co-Authored-By`.

### Review cycle (règle stricte)

Toute review de PR (humaine ou via skill `/review`) produit un **rapport d'étonnement** dans `docs/reviews/YYYY-MM-DD-STN-XX-rapport.md` (commité dans la branche feature).

Une PR n'est **jamais** mergeable tant qu'elle contient au moins un item ⚠️ **Important** ou 🚫 **Blocking** non traité. Cycle à itérer :

1. Review → liste items (✅ Praise / 💡 Suggestion / ⚠️ Important / 🚫 Blocking)
2. Si ⚠️ ou 🚫 présents → décision `⏸️ en attente`, le dev fixe
3. Après fixes → **re-review** (ajoute section `## Re-review (commit <sha>)` au rapport existant, **jamais** nouveau fichier)
4. Boucle 1→3 jusqu'à ne plus avoir que des 💡 résiduelles acceptables
5. Décision `✅ mergeable` uniquement quand 0 item ⚠️/🚫 non traité → merge squash

Les 💡 Suggestions résiduelles et items de dette non-bloquants restent tracés dans le rapport, convertibles en tickets Jira via `/ba` en fin de cycle.

### Environments (1 active at a time)

| Env | Usage | Deploy trigger |
|---|---|---|
| **dev** | Development | Manual — main (latest commit) |
| **test** | Pentest security | Manual — tag rc (frozen version) |
| **preview** | QA / acceptance | Manual — tag rc (after pentest) |
| **prod** | Production / jury demo | Manual — tag release |

### Versioning (SemVer)

- `v0.X.0-rc.N` : release candidate (test → preview)
- `v0.X.0` : release (prod)
- `v0.X.1` : hotfix
- Version centralized in `version.json`
- `GET /version` endpoint returns version + commit + env + deploy date

## Key Documents

- **Spec technique** : `docs/superpowers/specs/2026-04-14-stacknest-architecture-design.md`
- **Setup runner CD** : `docs/setup-github-runner.md`
- **Jira** : https://samrst-studies.atlassian.net/jira/software/projects/EOS/boards/34

## Design System

- **Fonts** : Inter/Roboto (UI), JetBrains Mono (code)
- **Colors** : Bleu nuit `#032233`, Cyan `#0d9297`, Jaune `#fea21f`, Error `#c42b1c`, Success `#22c55e`
