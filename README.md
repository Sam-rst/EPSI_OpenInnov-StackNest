# StackNest

> **Build Fast. Deploy Smart.**

![version](https://img.shields.io/badge/version-v0.6.0-0d9297) ![statut](https://img.shields.io/badge/statut-MVP-fea21f) ![stack](https://img.shields.io/badge/FastAPI%20%2B%20React-032233)

**StackNest — Internal Developer Platform : provisionner des ressources IT en autonomie via UI ou chat IA.**

StackNest est une *Internal Developer Platform* (IDP) qui permet à une équipe technique de provisionner des ressources IT (bases de données, caches, services, runtimes, stacks multi-services) **en autonomie**, sans ticket Ops, via deux portes d'entrée : une **interface web** (catalogue + formulaires) et un **assistant IA conversationnel** (« déploie-moi un PostgreSQL 16 »). Le tout **self-hosted**, sur du Docker piloté côté serveur.

---

## Fonctionnalités clés (MVP v0.6.0)

- **Catalogue** de 45 templates réels (versions + indicateurs LTS/EOL) avec **gates de déployabilité** : 31 ressources Docker provisionnables, 14 cartes visibles mais bloquées (10 Terraform + 4 runtimes langage).
- **Déploiement Docker live** d'une ressource via le **Docker SDK** (docker-py), avec suivi temps réel en **SSE** et **cycle de vie complet** (créer / arrêter / démarrer / régénérer le secret / détruire).
- **Composeur de stack Docker Compose** : un *builder* où l'on assemble N services, on déclare des **liens** entre eux (câblage de variables d'environnement `{to.*}`) et on déploie le tout comme un projet `docker compose`.
- **Chat IA guidé avec confirmation** : l'assistant propose le **déploiement d'un service** *et* la **composition d'une stack** (`deploy` / `compose_stack` / stop / start / regenerate), derrière une défense anti-hallucination (boîte à outils fermée + validation déterministe + confirmation obligatoire).
- **Authentification** complète : JWT access/refresh, vérification d'email, mot de passe oublié, RBAC admin/user.
- **Dashboard** (KPIs + sections) et **actions en masse** (bulk stop / start / suppression) sur les listes de déploiements et de stacks.

> Statut : MVP. Le **composeur de stack** et le déploiement multi-services sont fonctionnels mais signalés **bêta** dans l'UI ; certaines cartes du catalogue (Terraform / runtimes) sont volontairement **bloquées** (cf. [roadmap](docs/ROADMAP.md)).

---

## Stack technique

| Couche | Technologie |
|---|---|
| **Backend** | FastAPI (Python 3.13), uv, Clean Architecture vertical slicing |
| **Frontend** | React + Vite + TypeScript (SPA), Tailwind CSS |
| **Base de données** | PostgreSQL 16, SQLAlchemy async + asyncpg, Alembic |
| **Queue / temps réel** | Redis 7 : file de jobs **`arq`** (API → worker) + pub/sub SSE |
| **Provisioning** | **Docker SDK** (docker-py) + **compose CLI** (stacks), interface `Provisioner` pluggable (Terraform/Proxmox en roadmap) |
| **LLM** | Port agnostique + 3 adaptateurs : **Ollama** (défaut local), **OpenAI**, **Anthropic** |
| **Observabilité** | structlog (JSON), Sentry (back + front) |
| **CI / CD** | GitHub Actions (CI auto multi-lanes), CD self-hosted manuelle (`workflow_dispatch`) |

---

## Architecture

StackNest est un **monorepo modulaire** appliquant la **Clean Architecture + vertical slicing** côté backend **et** frontend (un dossier par feature : `auth`, `catalog`, `deployment`, `stack`, `chat`, `dashboard`…). Décision structurante : le **plan de contrôle** (API, DB, Redis, worker) ne fait **jamais tourner** les workloads utilisateurs — le worker pilote un **hôte Docker séparé** via `DOCKER_HOST`.

```
EPSI_OpenInnov-StackNest/
├── apps/
│   ├── api/              # FastAPI (API + worker, même paquet app/) — Clean Archi
│   ├── web/              # React + Vite + TS (SEUL front de production)
│   └── web-mockup/       # Référence design (hors CI / quality gate)
├── infra/terraform/      # environments/{dev,test,preview,prod} + modules/
├── .github/workflows/    # CI (auto) + CI nocturne
├── docs/                 # specs, charte, reviews, dossier de rendu
├── docker-compose.yml    # base + overrides .dev / .preview
└── scripts/worktree.sh   # worktrees multi-agents
```

Détail complet : **[`docs/rendu/rapport-technique.md`](docs/rendu/rapport-technique.md)** (architecture, choix justifiés, sécurité/RGPD, qualité) et les diagrammes Excalidraw dans **[`docs/architecture/`](docs/architecture/)**.

---

## Démarrage rapide

### Prérequis

- **Docker Desktop** (Docker + Docker Compose v2)
- **[uv](https://docs.astral.sh/uv/)** (backend Python 3.13) — pour lancer les tests back en natif
- **Node.js 20+** — pour lancer les tests front en natif

### 1. Cloner et lancer la stack iso-prod

L'environnement **preview** est l'iso-prod en local (build Nginx + uvicorn + migrate one-shot, MailHog pour capturer les mails). Un seul `up` démarre l'UI, l'API, le worker, la DB, Redis et MailHog ; le service `migrate` applique les migrations Alembic et seed le catalogue avant le démarrage de l'app.

```bash
git clone https://github.com/Sam-rst/EPSI_OpenInnov-StackNest.git
cd EPSI_OpenInnov-StackNest
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.preview.yml up -d --build
```

| Service | URL |
|---|---|
| **UI (SPA React + reverse-proxy `/api/`)** | http://localhost:8080 |
| **MailHog (inbox des mails capturés)** | http://localhost:8025 |

> Le worker exécute les conteneurs via le **démon Docker de l'hôte** : l'override preview monte `/var/run/docker.sock`. Assure-toi que Docker Desktop tourne.
>
> Swagger / ReDoc sont **désactivés** dans les environnements exposés (`preview`, `prod`) par défense en profondeur (pas de divulgation de la surface d'attaque). Pour explorer l'API interactivement, utilise la **variante développement** ci-dessous (`http://localhost:8080/api/docs`).

### 2. Créer un compte administrateur

L'auto-inscription ne crée que des comptes `user`. Le **premier admin** se crée via la CLI (compte pré-vérifié, rôle admin) :

```bash
docker compose -f docker-compose.yml -f docker-compose.preview.yml exec api \
  python -m app.cli create-admin --email admin@stacknest.local
```

Le mot de passe est demandé de manière masquée (ou via `--password` si besoin). Connecte-toi ensuite sur http://localhost:8080.

### 3. Arrêter / nettoyer

```bash
docker compose -f docker-compose.yml -f docker-compose.preview.yml down       # arrêt
docker compose -f docker-compose.yml -f docker-compose.preview.yml down -v     # + volumes db/redis
```

### Variante développement (hot reload)

Pour développer avec hot reload back (uvicorn `--reload`) **et** front (Vite HMR), utiliser l'override `dev` à la place de `preview` :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

En dev, l'UI (Vite HMR) reste sur http://localhost:8080 et le **Swagger** est exposé sur http://localhost:8080/api/docs. Le service `ollama` (LLM local) n'est jamais démarré par défaut — l'activer avec `--profile ollama`.

### Lancer les tests

```bash
# Backend (pytest + testcontainers)
cd apps/api
uv sync
uv run pytest                 # tout ; ou -m unit (rapide) / -m integ / -m e2e

# Frontend (Vitest + MSW + Playwright)
cd apps/web
npm install
npm test                      # ou test:unit / test:integ / e2e
```

---

## Documentation

| Sujet | Lien |
|---|---|
| **Dossier de rendu** (rapport technique, CDC, guide démo, business) | [`docs/rendu/`](docs/rendu/) |
| **Onboarding nouveau dev** | [`docs/ONBOARDING.md`](docs/ONBOARDING.md) |
| **Roadmap versionnée** | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| **Charte graphique & marque** | [`docs/brand/`](docs/brand/) |
| **Diagrammes d'architecture** | [`docs/architecture/`](docs/architecture/) |
| **Conventions & guide IA** | [`CLAUDE.md`](CLAUDE.md) |
| **Jira (board EOS)** | [samrst-studies.atlassian.net](https://samrst-studies.atlassian.net/jira/software/projects/EOS/boards/34) |

---

## Équipe

| Nom | Profil | Rôle |
|---|---|---|
| Samuel Ressiot | M1 DEV | Tech lead |
| Yassine Zouitni | M1 DEV | Développeur |
| Antony Lozano | M1 CYBER | Sécurisation, infra |
| Remi Reze | M1 CYBER | Audit, sécurité |
| Thomas Bremard | M1 CYBER | Conformité |
| Julien Volmerange | B1 | Design / QA, documentation |
| Mahe Pernot | B1 | Design / QA, documentation |

---

## Statut

**MVP v0.6.0** — chaîne complète livrée (catalogue, déploiement Docker live, composeur de stack, chat IA, dashboard, actions en masse), sous **TDD strict** et CI exigeante. Les **stacks multi-services** sont fonctionnelles mais en **bêta** ; le provisioning **Terraform/Proxmox** est en roadmap (cf. [`docs/ROADMAP.md`](docs/ROADMAP.md)).

## Licence

Projet propriétaire — EPSI OpenInnov 2025-2027.
