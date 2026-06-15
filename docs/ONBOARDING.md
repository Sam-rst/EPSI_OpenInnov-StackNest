# Onboarding — Nouveau développeur StackNest

> Guide pas-à-pas pour rendre un nouveau membre **productif rapidement** sur StackNest.
> La **source de vérité des conventions** est [`CLAUDE.md`](../CLAUDE.md) (à la racine) — ce guide
> en donne le chemin d'entrée concret, sans tout dupliquer.

StackNest est une **Internal Developer Platform** (IDP) : provisionner des ressources IT en autonomie
via une UI web ou un chat IA. Backend **FastAPI** (Python 3.13), frontend **React + Vite + TS**,
**PostgreSQL 16**, **Redis** (file `arq` + SSE), provisioning **Docker SDK + compose CLI**.

---

## 1. Prérequis

| Outil | Usage | Installation |
|---|---|---|
| **Docker Desktop** (Docker + Compose v2) | Lancer toute la stack | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **uv** | Backend Python 3.13 (deps, tests, lint) | `pip install uv` ou [docs.astral.sh/uv](https://docs.astral.sh/uv/) |
| **Node.js 20+** | Frontend (build, tests, lint) + Husky pré-commit | [nodejs.org](https://nodejs.org/) |
| **Git Bash / WSL** (Windows) | `scripts/worktree.sh` (bash) | — |

---

## 2. Cloner et monter la stack

```bash
git clone https://github.com/Sam-rst/EPSI_OpenInnov-StackNest.git
cd EPSI_OpenInnov-StackNest

npm install              # Husky (hooks de pré-commit : lint/format auto)
cp .env.example .env     # variables d'environnement (le .env reste gitignore)
```

> **Note :** les fichiers `docker-compose*.yml` et `.env.example` sont **à la racine** du dépôt
> (pas sous `infra/docker/`).

### Variante développement (hot reload back + front)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Le service one-shot `migrate` applique les migrations Alembic et seed le catalogue **avant** que
l'API démarre. Ensuite :

| Service | URL |
|---|---|
| UI (Vite HMR) | http://localhost:8080 |
| Swagger (dev uniquement) | http://localhost:8080/api/docs |
| MailHog (inbox des mails capturés) | http://localhost:8025 |
| PostgreSQL (outils devs) | `localhost:5432` (stacknest / stacknest) |
| Redis | `localhost:6379` |

Modifier un fichier sous `apps/api/app/` → uvicorn se reload ; sous `apps/web/src/` → Vite HMR.

### Variante iso-prod (preview)

```bash
docker compose -f docker-compose.yml -f docker-compose.preview.yml up -d --build
```

Build Nginx + uvicorn (pas de HMR), comme en prod. Swagger y est **désactivé** (défense en profondeur).

### Créer un compte admin

L'auto-inscription ne crée que des comptes `user`. Le premier admin se crée via la CLI :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec api \
  python -m app.cli create-admin --email admin@stacknest.local
```

### Le service `ollama` (LLM local)

Jamais démarré par défaut. L'activer avec `--profile ollama` (puis `ollama pull llama3.1`). Par
défaut le chat IA pointe sur Ollama ; on peut basculer sur OpenAI/Anthropic via `LLM_*` dans `.env`.

---

## 3. Lancer back & front en natif (debug fin)

Utile pour développer un seul service sans Docker.

```bash
# Backend (FastAPI)
cd apps/api
uv sync
uv run uvicorn app.main:app --reload      # nécessite une DB/Redis accessibles

# Frontend (nouveau terminal)
cd apps/web
npm install
npm run dev
```

---

## 4. Lancer les tests

TDD strict oblige : on lance les tests **en continu**.

```bash
# Backend (pytest + testcontainers + factory-boy)
cd apps/api
uv run pytest -m unit       # boucle TDD rapide
uv run pytest -m integ      # tests d'intégration (testcontainers : Docker requis)
uv run pytest -m e2e        # end-to-end
uv run pytest app/auth/     # un slice vertical entier
uv run pytest               # tout

# Frontend (Vitest + MSW + Playwright)
cd apps/web
npm run test:unit           # *.unit.test.{ts,tsx}
npm run test:integ          # *.integ.test.{ts,tsx}
npm test                    # toute la suite Vitest
npm run e2e                 # Playwright (E2E)
npm run test:coverage       # couverture
```

Cible de couverture : **80 % global**, **90 % sur la logique métier**.

---

## 5. Conventions (résumé — détail dans [`CLAUDE.md`](../CLAUDE.md))

- **TDD strict Red → Green → Blue** : écrire les tests qui échouent (RED), implémentation minimale
  (GREEN), refactor Software Craftsmanship (BLUE). Un commit par phase. Voir le skill `/tdd`.
- **Clean Architecture + vertical slicing**, back **et** front : un dossier par feature
  (`domain/` → `application/` → `infrastructure/` + `presentation/` côté back ;
  `contexts/`, `hooks/`, `pages/`, `services/`, `types/`, `mappers/`, `components/` côté front).
  Le domaine ne dépend de rien ; les features ne dépendent que de `core/`. Voir le skill `/clean-archi`.
- **1 fichier = 1 classe** (backend) / **1 fichier = 1 composant** (frontend). Séparation stricte
  **DTO (miroir API) / Model (UI) + mappers** côté front.
- **Tests colocalisés** dans `__tests__/{unit,integration}/` à côté du code ; E2E à part.
- **Commits en français**, référençant le ticket **`STN-XX`** (jamais `EOS-XX`, jamais `Co-Authored-By`).
- **Branches courtes** `feature/STN-XX-description` créées depuis `main`, merge via **PR vers `main`**
  (Trunk-Based Development). Titre de PR : `STN-XX — [Domaine] Description` (FR).
- **Quality gates bloquants** (CI casse au moindre écart) : lint (`ruff` / `eslint --max-warnings 0`),
  format (`ruff format` / `prettier --check`, CRLF interdit), types (`mypy` / `tsc`), tests, doc.
  Pré-commit Husky + lint-staged lance lint/format automatiquement.
- **UI 100 % en français** — tous les libellés et textes utilisateur restent en français.

---

## 6. Workflow worktrees multi-agents (dev parallèle)

Plusieurs devs/agents peuvent travailler en parallèle sur le même dépôt, chacun dans un **git
worktree isolé** avec **sa propre stack Docker** (nom de projet Compose unique + ports décalés par
slot), sans collision de ports. Outillé par `scripts/worktree.sh` (bash → Git Bash/WSL) :

```bash
scripts/worktree.sh new feature/STN-XX-slug   # crée le worktree (slot + .env + deps)
scripts/worktree.sh list                       # liste les worktrees
scripts/worktree.sh ports feature/STN-XX-slug  # affiche les 7 ports
scripts/worktree.sh rm feature/STN-XX-slug     # supprime + libère le slot
```

Détail et règles : skill `/worktree` et `docs/superpowers/specs/2026-06-04-worktree-convention.md`.

---

## 7. Où trouver quoi

| Je cherche… | C'est ici |
|---|---|
| Un slice backend | `apps/api/app/<feature>/` (auth, catalog, deployment, stack, chat…) |
| Un slice frontend | `apps/web/src/<feature>/` (+ `core/` bootstrap, `shared/` transverse) |
| La référence design (mockups) | `apps/web-mockup/` (**hors CI**, ne jamais importer en prod) |
| La charte graphique / marque | `docs/brand/` (palette, typo, logos, ton) |
| L'architecture détaillée | `docs/rendu/rapport-technique.md` + diagrammes `docs/architecture/` |
| Le dossier de rendu jury | `docs/rendu/` (rapport, CDC, guide démo, business) |
| La roadmap versionnée | `docs/ROADMAP.md` |
| Les conventions complètes | `CLAUDE.md` (racine) |
| Le board Jira | [samrst-studies.atlassian.net (EOS)](https://samrst-studies.atlassian.net/jira/software/projects/EOS/boards/34) |

---

## 8. Les skills projet (Claude Code)

Committés dans `.claude/skills/`, ils voyagent avec le dépôt. Les plus utiles au quotidien :

| Skill | Quand l'utiliser |
|---|---|
| **`/onboarding`** | Démarrer sur le projet (ce guide, version interactive) |
| **`/next-task`** | Identifier le prochain ticket Jira à prendre (début de session) |
| **`/ba`** | Créer un ticket avec sa DOR complète (toujours avant de créer un ticket) |
| **`/tdd`** | Dérouler le cycle Red → Green → Blue d'une feature/bugfix |
| **`/backend`**, **`/frontend`** | Implémenter une feature back / front en respectant la Clean Archi |
| **`/clean-archi`**, **`/craft`** | Valider l'architecture / la qualité du code |
| **`/review`** | Review de PR (produit un rapport d'étonnement dans `docs/reviews/`) |
| **`/migration`** | Créer une migration Alembic (upgrade + downgrade + test) |
| **`/worktree`** | Travailler en parallèle dans une stack Docker isolée |
| **`/pentest`**, **`/deploy`**, **`/debug`** | Audit sécu / déploiement / debug systématique |

> Pour une prise en main guidée et adaptée à ton rôle (M1 DEV / M1 CYBER / B1), invoque le skill
> **`/onboarding`** directement dans Claude Code.
