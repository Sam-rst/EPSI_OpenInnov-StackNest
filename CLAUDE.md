# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StackNest is an Internal Developer Platform (IDP) that enables technical teams to provision IT resources (VMs, databases, environments) autonomously via a web UI or an AI chatbot, using Terraform and Docker.

The entire UI is in **French** — all labels, text, and user-facing strings must remain in French.
Commits must be in **French** and reference the Jira ticket (EOS-XX).

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

## Architecture

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
api/app/
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

### Frontend — Clean Architecture + Vertical Slicing

```
ui/src/
├── core/                    # Config, client API, auth context, layout, router
├── auth/                    # components/ pages/ services/ hooks/ types/
├── catalog/
├── deployment/
├── chat/
├── dashboard/
└── main.tsx
```

## Skills

- **`/ba`** — Generate Jira tickets with full DOR (Definition of Ready). Use for creating stories, tasks, or bugs. Every ticket must have 6 sections: Contexte, Criteres d'acceptation (min 3, Given/When/Then), Parcours utilisateur, Perimetre, Impact technique, Risques et dependances, Scenarios de test.

## Methodology

### TDD strict (Red → Green → Blue)

1. **RED** : write failing tests (unit + integration + E2E)
2. **GREEN** : minimum implementation to pass
3. **BLUE** : refactor (Software Craftsmanship)

### Software Craftsmanship (Blue phase)

- Explicit naming (no abbreviations)
- Functions <= 20 lines, single responsibility
- Early return, named constants, structured logs
- Custom typed exceptions
- Try/catch on all side-effect code (network, DB, timers)

### Validation order

Code → Green tests → Lint (0 errors, 0 warnings) → Docs → Commit

### Test coverage

- **80% global minimum**, **90% on business logic**
- 3 levels: unit (services), integration (handlers + mocks), E2E (real server)

## Gitflow

- **main** : production
- **preview/staging** : pre-production
- **develop** : development
- **feature/EOS-XX-description**, **bugfix/EOS-XX-description** : work branches
- Never commit directly on main/develop/staging
- Never add `Co-Authored-By`
- Always push after merge
- Clean working tree before any new change

## Versioning (SemVer)

- 0.x.y in development, 1.0.0 at first public launch
- PATCH before MINOR (bugfixes before features)
- Version centralized in `version.json`, synced in package.json/pyproject.toml

## Key Documents

- **Spec technique** : `docs/superpowers/specs/2026-04-14-stacknest-architecture-design.md`
- **Setup runner CD** : `docs/setup-github-runner.md`
- **Jira** : https://samrst-studies.atlassian.net/jira/software/projects/EOS/boards/34

## Design System

- **Fonts** : Inter/Roboto (UI), JetBrains Mono (code)
- **Colors** : Bleu nuit `#032233`, Cyan `#0d9297`, Jaune `#fea21f`, Error `#c42b1c`, Success `#22c55e`
