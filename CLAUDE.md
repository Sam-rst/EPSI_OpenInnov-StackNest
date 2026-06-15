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

StackNest is an Internal Developer Platform (IDP) that enables technical teams to provision IT resources (containers, databases, stacks) autonomously via a web UI or an AI chatbot. User deployments are orchestrated by a worker via the Docker SDK (containers) and `docker compose` (stacks); Terraform provisions the platform environments themselves.

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
- **Deploiements utilisateurs** : worker arq + **Docker SDK** (conteneurs) et `docker compose` (stacks)
- **IaC** : Terraform (`infra/terraform/`) pour le provisioning des **environnements** (Docker provider MVP, Proxmox stretch)
- **Queue/Realtime** : Redis (job queue arq + pub/sub SSE)
- **LLM** : Pluggable — Ollama (default) / OpenAI / Anthropic (fallback)
- **Infra** : Docker Compose, VM Proxmox (serveur Antony), VPN access
- **CI** : GitHub Actions (cloud runner) — `ci.yml` (push/PR) + `ci-nightly.yml` (taches lentes)
- **CD** : Self-hosted GitHub Actions runner on Antony's server (manuel, `workflow_dispatch`)
- **Monitoring** : Sentry (back + front), structlog JSON (logs)
- **Lint/format** : ruff (back, via `uv run poe`), eslint + prettier (front, scripts npm)

## Architecture

### Monorepo modulaire

```
stacknest/
├── apps/
│   ├── api/          # FastAPI backend (API HTTP + worker arq, meme paquet app/)
│   ├── web/          # React + Vite (web app) — SEUL front de production
│   └── web-mockup/   # Référence design (mockups Yassine) — HORS CI/quality gate
├── infra/
│   ├── terraform/    # environments/ + modules/ (provisioning des environnements)
│   └── ...
├── scripts/          # worktree.sh (worktrees multi-agents)
├── docker-compose.yml          # Stack de base (api, worker, ui, db, redis...)
├── docker-compose.dev.yml      # Override dev (Mailhog, Ollama, hot-reload)
├── docker-compose.preview.yml  # Override preview/QA
├── .github/workflows/ # ci.yml (push/PR, 3 lanes api/web/infra) + ci-nightly.yml (e2e/mutation/secu)
├── docs/
├── sonar-project.properties
└── version.json      # SemVer centralisee (source de la version injectee au build)
```

> Il n'y a **pas** d'`apps/worker` ni de `package.json` racine : le worker de
> déploiement vit dans `apps/api` (lancé via `arq app.worker_main.WorkerSettings`,
> cf. `WorkerSettings`) et partage le paquet `app/` avec l'API. Les
> `docker-compose*.yml` sont **à la racine** du dépôt.

### Docker Compose Services

| Service | Role |
|---|---|
| **ui** (Nginx) | SPA React, reverse-proxy `/api/` vers API |
| **api** (FastAPI) | Logique metier, auth, catalogue, orchestration |
| **worker** (Python + arq) | Consomme la file `arq`, orchestre conteneurs (**Docker SDK** — `DockerSdkProvisioner`) et stacks (`docker compose` — `ComposeCliProvisioner`). Meme image que l'API, isole du web. |
| **db** (PostgreSQL 16) | Users, catalogue, deploiements, conversations |
| **redis** (Redis 7) | Queue jobs API→Worker (arq) + pub/sub SSE |
| **ollama** (optionnel, override dev) | LLM local |

> Terraform (`infra/terraform/`) sert au provisioning des **environnements**
> (dev/test/preview/prod), **pas** aux déploiements utilisateurs : ceux-ci passent
> par le worker arq via Docker SDK (conteneurs) et `docker compose` (stacks).

### Backend — Clean Architecture + Vertical Slicing

```
apps/api/app/
├── core/                    # Config, BDD, Redis, securite, deps partagees (bootstrap)
├── shared/                  # Code transverse reutilise par >=2 slices
├── auth/                    # domain/ application/ infrastructure/ presentation/
├── catalog/                 # domain/ application/ infrastructure/ presentation/
├── deployment/              # domain/ application/ infrastructure/ presentation/ (worker arq)
├── stack/                   # domain/ application/ infrastructure/ presentation/ (provisioning compose)
├── chat/                    # domain/ application/ infrastructure/ presentation/ (LLM)
├── email/                   # envoi d'emails (verification, reset)
├── health/                  # liveness probe /health
├── main.py                  # Entrypoint API
└── worker_main.py           # Entrypoint Worker (arq — WorkerSettings)
```

Slices metier reels : `auth, catalog, deployment, stack, chat` (+ `email`, `health`)
plus `core`/`shared`. **Le dashboard est front-only** (`apps/web/`), il n'y a
**pas** de slice backend `dashboard`.

Each feature has its own domain/application/infrastructure/presentation layers. Features depend only on `core/`/`shared/` and communicate via domain interfaces.

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

### Référence design — `apps/web-mockup` (hors quality gate)

`apps/web-mockup/` est une **archive de design vivante** : le travail front prototypé par Yassine
(branche `mockups`), copié **tel quel** (React 18 / Tailwind 3 / Vite 5, aucune migration). Sert de
référence visuelle/UX pour redévelopper chaque feature **proprement en TDD strict dans `apps/web`**.

**Règles non-négociables :**
- ❌ **N'est PAS du code de production.** Ne jamais l'importer depuis `apps/web` ni le merger dedans.
- ❌ **Hors CI / quality gate par construction** : aucun `package.json` racine (pas de workspaces),
  les lanes CI ciblent `apps/web`. Sonar exclut `apps/web-mockup/**` dans les **deux** fichiers de
  config — `sonar-project.properties` (scanner CI nocturne) **et** `.sonarcloud.properties`
  (Automatic Analysis, le check « SonarCloud Code Analysis » des PR). Ne pas l'y rattacher.
- ✅ **App autonome** : `cd apps/web-mockup && npm install && npm run dev` (Vite, port 5173).
  Note : `npm run build` (`tsc -b`) échoue en l'état (`@types/node` absent côté mockup) — connu et
  accepté, on ne « répare » pas le prototype. Le chemin de lancement supporté est `npm run dev`.
- ✅ **Toute évolution UI réelle** se fait dans `apps/web` ticket par ticket (Clean Archi + TDD),
  en s'inspirant du mockup. La branche `mockups` reste conservée comme archive d'origine.

Détails : `docs/superpowers/specs/2026-06-04-integration-mockup-reference.md`.

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

## Sécurité — SAST & supply-chain (versions épinglées)

Pour des scans **reproductibles**, les outils de sécurité et les actions
GitHub tierces sont **épinglés** (pas de `latest`/`@master` flottant). Tout
bump est volontaire et tracé dans un commit dédié.

- **Semgrep** : image Docker épinglée **`semgrep/semgrep:1.166.0`** (tag + digest
  `sha256:c180f0c93a17b420c0af5006214a29d3c747c5459c732b740191adf657dd0068`),
  utilisée par les lanes `security-api` / `security-web` de `ci.yml`. Garder
  les deux lanes alignées sur la même version au prochain bump.
- **Rulesets semgrep** : registres distants versionnés par Semgrep —
  `p/python` (lane API), `p/typescript` (lane web) et `p/security-audit`
  (les deux). Scan en `--severity=ERROR --error` (échec dur sur finding ERROR).
  Tests exclus via `.semgrepignore` (fixtures = secrets factices).
  Reproduire en local : `docker run --rm -v "$PWD:/src" semgrep/semgrep:1.166.0
  semgrep scan --config=p/python --config=p/security-audit --error
  --severity=ERROR apps/api` (idem `p/typescript` + `apps/web`).
- **Trivy** : `aquasecurity/trivy-action` épinglé au SHA de `v0.36.0` (ex-`@master`).
- **Checkov** : `bridgecrewio/checkov-action` épinglé au SHA de `v12.1347.0` (ex-`@master`).
- **Actions GitHub tierces** (`docker/*`, `anchore/*`, `hashicorp/*`,
  `raven-actions/*`, `SonarSource/*`) : épinglées au **SHA complet** avec un
  commentaire `# vX` (résout SonarCloud S7637, supply-chain).
- **Permissions GITHUB_TOKEN** : baseline `permissions: {}` (deny-all) au niveau
  workflow ; chaque job redéclare le scope minimal (`contents: read`). Résout
  SonarCloud S8264/S8233.

## Trunk-Based Development (TBD)

- **main** (trunk) : always deployable, everything goes through PRs
- **feature/STN-XX-description** : short-lived (<2 days), created from main
- **hotfix/STN-XX-description** : critical prod fix, merge to main + tag patch
- Never add `Co-Authored-By`
- Lint/format avant commit : ruff (back, `uv run poe fix`) et eslint/prettier (front). Pas de pre-commit Husky/lint-staged configure dans ce repo.
- CI is automatic (push/PR). **CD is ALWAYS manual** (workflow_dispatch).

### PR conventions

- **Titre** : `<type>(STN-XX): description courte` (FR, <70 caracteres) — Conventional
  Commit (cf. section « Versioning & Conventional Commits »). Ex.
  `feat(STN-42): catalogue — filtre par tag`. Remplace l'ancien format
  `STN — [Domaine] …` (l'info de domaine peut rester dans la description).
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

### Versioning & Conventional Commits (SemVer)

**La version se dérive de l'historique des commits** (style *semantic-release*), pas à
la main. On adopte un **type Conventional Commit** sur le titre de chaque PR /
**squash-merge**, en gardant le **français** et la **référence STN-XX**.

#### Format de titre de PR / squash-merge

```
<type>(STN-XX): description courte en français
```

- **Remplace / standardise** l'ancien format `STN — [Domaine] …` pour les **futurs**
  commits. L'historique passé reste tel quel (le script sait le classer en repli).
- Types : `feat` · `fix` · `docs` · `chore` · `refactor` · `test` · `ci` · `build` ·
  `perf` · `style`. On peut conserver l'info de domaine dans la description
  (ex. `feat(STN-42): catalogue — filtre par tag`).
- Breaking change : suffixe `!` (`feat!(STN-XX): …`) ou ligne `BREAKING CHANGE:` dans
  le corps.

Exemples :

```
feat(STN-42): déploiement — action « pause » réelle (docker pause)
fix(STN-58): chat — ordre des messages d'un fil (clock_timestamp)
docs(STN-99): dossier de rendu oral jury
chore(STN-105): pose la version 0.78.0
refactor(STN-12): extrait le mapper Template du repository
```

#### Mapping SemVer (pré-1.0, `0.y.z`)

| Type de commit | Bump |
|---|---|
| `feat` | **minor** (`0.y.0`, remet le patch à 0) |
| `fix` | **patch** (`0.y.z+1`) |
| `docs` / `chore` / `refactor` / `test` / `ci` / `build` / `style` / `perf` | **pas de bump** |
| `feat!` / `BREAKING CHANGE` | **major** — *à partir de la 1.0 seulement* (pré-1.0, traité comme un `feat`) |

**Version courante : `0.78.0`** (78 *feat*, 17 *fix* sur 122 commits historiques).
Centralisée dans `version.json` à la racine (`{ version, name, description }`), reflétée
dans `apps/api/pyproject.toml` (+ `uv.lock`) et `apps/web/package.json`.

#### Dériver la prochaine version

```bash
bash scripts/next-version.sh            # affiche la prochaine version (stdout, ex. 0.79.0)
bash scripts/next-version.sh --verbose  # + recap feat/fix/autres sur stderr
```

Le script lit les commits **depuis le dernier tag annoté `vX.Y.Z`**
(`git describe --tags --abbrev=0` puis `git log <tag>..HEAD`), classe chaque sujet
(type Conventional Commit explicite, sinon repli par mots-clés pour l'ancien format
`STN — [Domaine] …`), applique le mapping ci-dessus et affiche la version. Sans tag, il
calcule depuis le 1er commit. Sortie « nue » sur stdout, capturable :
`VERSION=$(bash scripts/next-version.sh)`.

#### Process de release

1. **Dériver** : `VERSION=$(bash scripts/next-version.sh)`.
2. **Propager** la version dans les 3 sources : `version.json`,
   `apps/api/pyproject.toml` (+ `uv lock`), `apps/web/package.json`.
3. **Tag annoté** : `git tag -a v$VERSION -m "Release v$VERSION"` puis `git push --tags`.
   Pour une RC : `v0.X.0-rc.N` (test → preview) ; release : `v0.X.0` (prod) ;
   hotfix : `v0.X.1`.

#### Propagation au runtime

- **Chaine de propagation** : la CI lit `version.json` → injecte `APP_VERSION`
  (+ `GIT_COMMIT`, `DEPLOYED_AT`) comme build args Docker (cf. `docker-compose.yml`
  + `apps/api/Dockerfile` `ARG APP_VERSION`) → `ENV` runtime → lu par
  `pydantic-settings` (`Settings.app_version`).
- **`GET /version`** (slice `core`, sert `version + commit + env + deployed_at`)
  lit ces env vars. Sans injection (dev local), les defaults reprennent `0.78.0`.

## Worktrees multi-agents (dev parallèle)

Plusieurs agents/devs peuvent travailler en parallèle sur le même dépôt via des git worktrees
isolés, chacun avec **sa propre stack Docker** (nom de projet Compose unique + ports décalés),
sans collision. Outillé par `scripts/worktree.sh` (skill `/worktree`).

- **Slot** : chaque worktree obtient un slot ≥ 1 ; slot 0 = dépôt principal (ports par défaut).
- **Ports** : `port = base + slot×100` sur 7 services (API, UI, Postgres, Redis, Mailhog SMTP/UI, Ollama).
- **Projet Docker** : `stacknest-wt<slot>`, exporté via `COMPOSE_PROJECT_NAME` dans le `.env` du worktree.
- **Registre** : `.worktrees/registry.json` (gitignored).

```bash
scripts/worktree.sh new feature/STN-XX-slug   # crée le worktree (slot + .env + deps)
scripts/worktree.sh list                       # liste les worktrees
scripts/worktree.sh ports feature/STN-XX-slug  # affiche les 7 ports
scripts/worktree.sh rm feature/STN-XX-slug     # supprime + libère le slot
```

Détails : `docs/superpowers/specs/2026-06-04-worktree-convention.md` et skill `/worktree`.
Script bash → exécution via WSL/Git Bash (Windows natif hors scope).

## Key Documents

- **Spec technique** : `docs/superpowers/specs/2026-04-14-stacknest-architecture-design.md`
- **Setup runner CD** : `docs/setup-github-runner.md`
- **Jira** : https://samrst-studies.atlassian.net/jira/software/projects/EOS/boards/34

## Design System

- **Charte complète (source de vérité)** : `docs/brand/` — charte vivante (`docs/brand/README.md` :
  palette + tokens clair/sombre, typo, logos, ton), PDF d'origine, logos SVG dans `docs/brand/assets/`.
- **Fonts** : Inter/Roboto (UI), JetBrains Mono (code)
- **Colors** : Bleu nuit `#032233`, Cyan `#0d9297`, Jaune `#fea21f`, Error `#c42b1c`, Success `#22c55e`
