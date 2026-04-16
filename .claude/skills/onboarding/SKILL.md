---
name: onboarding
description: Onboard a new developer to the StackNest project. Use when a team member joins the project, needs help getting started, or asks about project conventions. Triggers on "onboarding", "getting started", "how does this project work?", "I'm new", "setup my environment", "where do I start?", or when a developer seems unfamiliar with the project structure.
---

# Onboarding — New Developer Guide

Help a new team member get productive on StackNest as fast as possible. Adapt the depth based on their role (dev, cyber, B1) and experience level.

## When to use

- New developer joins the project
- Someone asks "how does this work?" about the project
- Someone needs help setting up their environment
- A B1 starts their first ticket

## Step 1 — Identify the person

Ask which role they have:

| Role | What they need to know | Depth |
|---|---|---|
| **Dev (M1 DEV)** | Everything — archi, TDD, clean archi, tooling | Full |
| **Cyber (M1 CYBER)** | Infrastructure, security, pentest workflow, Docker | Security-focused |
| **B1** | Frontend basics, React components, documentation, how to run the app | Beginner-friendly |

## Step 2 — Environment setup

### For everyone

```bash
# 1. Clone the repo
git clone https://github.com/Sam-rst/EPSI_OpenInnov-StackNest.git
cd EPSI_OpenInnov-StackNest

# 2. Install root dependencies (husky for pre-commit)
npm install

# 3. Copy environment files
cp infra/docker/.env.example infra/docker/.env

# 4. Launch all services
cd infra/docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# 5. Verify
# → http://localhost:8080 (UI)
# → http://localhost:8080/api/health (API)
# → http://localhost:8080/api/docs (Swagger)
```

### For devs (additional)

```bash
# Backend (Python)
cd apps/api
uv sync                    # install dependencies
uv run pytest              # run tests
uv run ruff check .        # lint
uv run mypy .              # type check

# Frontend (TypeScript)
cd apps/ui
npm install                # install dependencies
npm run dev                # dev server with HMR
npm run test               # run tests
npm run lint               # lint
```

### For cyber (additional)

- VPN access to Antony's server
- Access to the Pentest board on Jira
- Read `docs/setup-github-runner.md`

## Step 3 — Project overview (5 minutes)

Explain based on role:

### For devs

"StackNest lets users deploy Docker containers (databases, runtimes) through a web UI or a chatbot. The architecture is:

- **apps/api/** — FastAPI backend, Clean Architecture with vertical slicing. Each feature (auth, catalog, deployment, chat) has its own domain/application/infrastructure/presentation layers. 1 file = 1 class.
- **apps/ui/** — React + Vite + TypeScript frontend. Same vertical slicing. DTO/Model/Mapper pattern — the API sends DTOs (snake_case), we map them to Models (camelCase, enriched) via mappers. Components only see Models, never DTOs.
- **infra/** — Docker Compose, Terraform modules, deployment scripts.

We use strict TDD: Red (write test) → Green (simplest impl) → Blue (refactor Craft). Each phase has its own commit."

### For cyber

"Your job is to pentest each feature after the devs ship it. You work on a sprint décalé — when the devs finish version N, you test version N on the TEST environment while they start version N+1. Use the `/pentest` skill for a structured OWASP audit."

### For B1

"You'll work on the user documentation (guides in-app) and potentially the login/register pages. The frontend uses React with TypeScript and Tailwind CSS. Don't worry about the backend — focus on components in `apps/ui/src/`. Read `apps/ui/docs/guide-developpeur.md` for how to create a new component."

## Step 4 — First task

### For devs

1. Read `apps/api/docs/guide-developpeur.md`
2. Read `apps/ui/docs/guide-developpeur.md`
3. Look at an existing ticket on Jira (DOR structure)
4. Pick their first ticket from the sprint backlog
5. Create a feature branch: `git checkout -b feature/STN-XX-description main`
6. Use `/tdd` to implement

### For cyber

1. Check the Pentest board
2. Read the DOR of the latest released version
3. Use `/pentest` to start the audit
4. Create Bug tickets for findings

### For B1

1. Read `apps/ui/README.md`
2. Run the app locally with Docker Compose
3. Look at an existing component to understand the structure
4. Pick their ticket (documentation or login/register)
5. Ask questions — the team is there to help

## Step 5 — Key conventions to know

| Convention | Rule |
|---|---|
| Commits | In French, prefix `test/feat/fix/refactor(STN-XX):` |
| Branches | `feature/STN-XX-description` from main, <2 days |
| TDD | Red → Green → Blue, commit at each phase |
| Tests | `.unit.`, `.integ.`, `.e2e.` naming convention |
| Backend | 1 file = 1 class, clean archi layers, structlog, Sentry |
| Frontend | 1 file = 1 component, DTO/Model/Mapper, Tailwind charte graphique |
| Reviews | Educational — praise first, explain WHY |
| Jira | Ticket must have DOR before development |
| Deploy | Always manual (GitHub Actions workflow_dispatch) |

## Available skills

| Skill | Use for |
|---|---|
| `/ba` | Create a new ticket with DOR |
| `/tdd` | Implement with strict TDD |
| `/backend` | Guide backend implementation |
| `/frontend` | Guide frontend implementation |
| `/craft` | Check/learn Software Craftsmanship |
| `/clean-archi` | Check/learn Clean Architecture |
| `/review` | Review a MR/PR |
| `/pentest` | Security audit |
| `/debug` | Debug a bug systematically |
| `/deploy` | Deploy to an environment |
| `/migration` | Create a database migration |
