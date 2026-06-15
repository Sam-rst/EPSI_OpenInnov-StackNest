<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/brand/assets/logo.svg">
  <img src="docs/brand/assets/logo.svg" alt="StackNest" width="300">
</picture>

# StackNest

### ⚡ Build Fast. Deploy Smart.

*Internal Developer Platform — provisionnez vos ressources IT **en autonomie**, via interface web ou assistant IA. Self-hosted, sur Docker piloté côté serveur.*

<br/>

[![version](https://img.shields.io/badge/version-0.78.0-0d9297?style=flat-square)](docs/ROADMAP.md)
[![statut](https://img.shields.io/badge/statut-MVP-fea21f?style=flat-square)](#-statut)
[![licence](https://img.shields.io/badge/licence-propriétaire-032233?style=flat-square)](#-licence)
[![CI](https://github.com/Sam-rst/EPSI_OpenInnov-StackNest/actions/workflows/ci.yml/badge.svg)](https://github.com/Sam-rst/EPSI_OpenInnov-StackNest/actions/workflows/ci.yml)

[![tests](https://img.shields.io/badge/tests-2%20000%2B%20✓-22c55e?style=flat-square)](#-tests--qualité)
[![couverture](https://img.shields.io/badge/couverture-~95%25-22c55e?style=flat-square)](#-tests--qualité)
[![TDD](https://img.shields.io/badge/méthode-TDD%20strict-032233?style=flat-square)](#-méthodologie)
[![commits](https://img.shields.io/badge/commits-conventional-fe5196?style=flat-square&logo=conventionalcommits&logoColor=white)](CLAUDE.md)

<br/>

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python%203.13-3776AB?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL%2016-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis%207-FF4438?style=flat-square&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

<br/>

**[✨ Fonctionnalités](#-fonctionnalités-clés-mvp-v0780)** · **[🧱 Stack](#-stack-technique)** · **[🏗️ Architecture](#️-architecture)** · **[🚀 Démarrage](#-démarrage-rapide)** · **[🧪 Qualité](#-tests--qualité)** · **[📚 Docs](#-documentation)** · **[🗺️ Roadmap](docs/ROADMAP.md)**

</div>

---

StackNest est une *Internal Developer Platform* (IDP) qui permet à une équipe technique de provisionner des ressources IT (bases de données, caches, services, runtimes, stacks multi-services) **en autonomie**, sans ticket Ops, via deux portes d'entrée : une **interface web** (catalogue + formulaires) et un **assistant IA conversationnel** (« déploie-moi un PostgreSQL 16 »). Le tout **self-hosted**, sur du Docker piloté côté serveur.

## ✨ Fonctionnalités clés (MVP v0.78.0)

| | Fonctionnalité | Détail |
|---|---|---|
| 📦 | **Catalogue** | 45 templates réels (versions + LTS/EOL) avec **gates de déployabilité** : 31 ressources Docker provisionnables, 14 cartes visibles mais bloquées (10 Terraform + 4 runtimes). |
| 🚀 | **Déploiement Docker live** | Provisioning via **Docker SDK** (docker-py), suivi temps réel en **SSE**, **cycle de vie complet** (créer / arrêter / démarrer / régénérer le secret / détruire). |
| 🧩 | **Composeur de stack Compose** | *Builder* où l'on assemble N services, on déclare des **liens** (`{to.*}`) et on déploie le tout comme un projet `docker compose`. |
| 🤖 | **Chat IA guidé** | L'assistant propose le **déploiement** *et* la **composition d'une stack** (`deploy` / `compose_stack` / stop / start / regenerate), derrière une défense anti-hallucination (boîte à outils fermée + validation déterministe + **confirmation obligatoire**). |
| 🔐 | **Authentification** | JWT access/refresh, vérification d'email, mot de passe oublié, **RBAC** admin/user, rate-limiting anti brute-force. |
| 📊 | **Dashboard & actions en masse** | KPIs + sections, **bulk** stop / start / suppression sur les listes de déploiements et de stacks. |

> **Statut : MVP.** Le **composeur de stack** et le déploiement multi-services sont fonctionnels mais signalés **bêta** dans l'UI ; certaines cartes du catalogue (Terraform / runtimes) sont volontairement **bloquées** — cf. [roadmap](docs/ROADMAP.md).

## 🧱 Stack technique

| Couche | Technologie |
|---|---|
| **Backend** | FastAPI (Python 3.13), uv, Clean Architecture vertical slicing |
| **Frontend** | React + Vite + TypeScript (SPA), Tailwind CSS |
| **Base de données** | PostgreSQL 16, SQLAlchemy async + asyncpg, Alembic |
| **Queue / temps réel** | Redis 7 : file de jobs **`arq`** (API → worker) + pub/sub SSE |
| **Provisioning** | **Docker SDK** (docker-py) + **compose CLI** (stacks), interface `Provisioner` pluggable (Terraform/Proxmox en roadmap) |
| **LLM** | Port agnostique + 3 adaptateurs : **Ollama** (défaut local), **OpenAI**, **Anthropic** |
| **Observabilité** | structlog (JSON), Sentry (back + front) |
| **CI / CD** | GitHub Actions (CI auto multi-lanes + nocturne), CD self-hosted manuelle (`workflow_dispatch`) |
| **Qualité / sécu** | ruff · eslint + prettier · pytest + testcontainers · Vitest + Playwright · Semgrep · Checkov · gitleaks · Trivy · SonarCloud |

## 🏗️ Architecture

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

> 📐 Détail complet : **[`docs/rendu/rapport-technique.md`](docs/rendu/rapport-technique.md)** (architecture, choix justifiés, sécurité/RGPD, qualité) et les diagrammes Excalidraw dans **[`docs/architecture/`](docs/architecture/)**.

## 🚀 Démarrage rapide

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
| 🌐 **UI (SPA React + reverse-proxy `/api/`)** | http://localhost:8080 |
| 📧 **MailHog (inbox des mails capturés)** | http://localhost:8025 |

> Le worker exécute les conteneurs via le **démon Docker de l'hôte** : l'override preview monte `/var/run/docker.sock`. Assure-toi que Docker Desktop tourne.
>
> Swagger / ReDoc sont **désactivés** dans les environnements exposés (`preview`, `prod`) par défense en profondeur. Pour explorer l'API interactivement, utilise la **variante développement** ci-dessous (`http://localhost:8080/api/docs`).

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

## 🧪 Tests & qualité

Développement en **TDD strict** (Red → Green → Blue) et **CI exigeante** (lint/format/typecheck/sécurité/tests/build sur 3 lanes api·web·infra, `eslint --max-warnings 0`, gate de couverture ≥ 80 %).

```bash
# Backend (pytest + testcontainers)
cd apps/api && uv sync
uv run pytest                 # tout ; ou -m unit (rapide) / -m integ / -m e2e

# Frontend (Vitest + MSW + Playwright)
cd apps/web && npm install
npm test                      # ou test:unit / test:integ / e2e
```

| Indicateur | Valeur |
|---|---|
| 🧪 **Tests** | ~1 184 backend · ~903 frontend (unit / integ / e2e) |
| 📈 **Couverture** | ~95 % (gate CI ≥ 80 %, ≥ 90 % sur la logique métier) |
| 🛡️ **Sécurité** | Semgrep (épinglé) · Checkov · gitleaks · Trivy · SonarCloud · `permissions:` least-privilege |
| 🔁 **Process** | Trunk-Based Dev · 1 PR / feature · review + rapport d'étonnement · squash en *conventional commit* |

## 📚 Documentation

| Sujet | Lien |
|---|---|
| 📑 **Dossier de rendu** (rapport technique, CDC, guide démo, business) | [`docs/rendu/`](docs/rendu/) |
| 🚪 **Onboarding nouveau dev** | [`docs/ONBOARDING.md`](docs/ONBOARDING.md) |
| 🗺️ **Roadmap versionnée** | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| 🎨 **Charte graphique & marque** | [`docs/brand/`](docs/brand/) |
| 📐 **Diagrammes d'architecture** | [`docs/architecture/`](docs/architecture/) |
| 🤖 **Conventions & guide IA** | [`CLAUDE.md`](CLAUDE.md) |
| 📋 **Jira (board STN)** | [samrst-studies.atlassian.net](https://samrst-studies.atlassian.net/jira/software/projects/STN/boards/34) |

## 👥 Équipe

| Nom | Profil | Rôle |
|---|---|---|
| **Samuel Ressiot** | M1 DEV | Tech lead |
| Yassine Zouitni | M1 DEV | Développeur |
| Antony Lozano | M1 CYBER | Sécurisation, infra |
| Remi Reze | M1 CYBER | Audit, sécurité |
| Thomas Bremard | M1 CYBER | Conformité |
| Julien Volmerange | B1 | Design / QA, documentation |
| Mahe Pernot | B1 | Design / QA, documentation |

## 📌 Statut

**MVP v0.78.0** — chaîne complète livrée (catalogue, déploiement Docker live, composeur de stack, chat IA, dashboard, actions en masse), sous **TDD strict** et CI exigeante. Les **stacks multi-services** sont fonctionnelles mais en **bêta** ; le provisioning **Terraform/Proxmox** est en roadmap (cf. [`docs/ROADMAP.md`](docs/ROADMAP.md)).

## 📄 Licence

Projet propriétaire — EPSI OpenInnov 2025-2027.

<div align="center">
<sub>Construit avec ⚡ par l'équipe StackNest — EPSI M1 Open Innovation</sub>
</div>
