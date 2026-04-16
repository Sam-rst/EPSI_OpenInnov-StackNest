# StackNest

> **Build Fast. Deploy Smart.**

StackNest est une Internal Developer Platform (IDP) permettant aux equipes techniques de provisionner des ressources IT (VM, BDD, environnements) de maniere autonome via une interface web ou un chatbot IA, en utilisant Terraform et Docker.

## Stack technique

| Composant | Technologie |
|---|---|
| Backend | FastAPI (Python 3.13), uv |
| Frontend | React + Vite + TypeScript, Tailwind CSS |
| Base de donnees | PostgreSQL 16, SQLAlchemy async, Alembic |
| IaC | Terraform (Docker provider) |
| Queue / Temps reel | Redis (job queue + pub/sub SSE) |
| LLM | Pluggable — Ollama (defaut) / OpenAI (fallback) |
| CI | GitHub Actions |
| CD | Self-hosted runner |
| Monitoring | Sentry, structlog JSON |

## Architecture

```
stacknest/
├── apps/
│   ├── api/          # Backend FastAPI (Clean Architecture + Vertical Slicing)
│   ├── web/          # Frontend React + Vite + TypeScript
│   └── worker/       # Worker Terraform (isole du web)
├── infra/
│   ├── docker/       # Docker Compose (dev, test, preview, prod)
│   ├── terraform/    # Modules + environnements
│   └── scripts/      # Gestion des environnements (start/stop)
├── .github/workflows/ # CI/CD
├── configs/          # Outils qualite (semgrep, spectral, checkov, k6)
├── docs/             # Spec technique, architecture, guides
├── .claude/skills/   # Skills Claude Code (BA, TDD, backend, frontend, review...)
├── package.json      # Husky + lint-staged
└── version.json      # Version SemVer centralisee
```

## Prerequis

- Docker + Docker Compose
- Python 3.13 + [uv](https://docs.astral.sh/uv/)
- Node.js 20+
- Acces VPN au serveur (pour les environnements distants)

## Demarrage rapide

```bash
# 1. Cloner le repo
git clone https://github.com/Sam-rst/EPSI_OpenInnov-StackNest.git
cd EPSI_OpenInnov-StackNest

# 2. Installer les outils root (husky pre-commit)
npm install

# 3. Backend
cd apps/api
uv sync
uv run uvicorn app.main:app --reload

# 4. Frontend
cd apps/web
npm install
npm run dev

# 5. Docker Compose (tous les services)
cd infra/docker
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Environnements

| Env | Usage | Deploy |
|---|---|---|
| **dev** | Developpement continu | Manuel (GitHub Actions) |
| **test** | Pentest securite | Manuel (tag RC) |
| **preview** | QA / recette | Manuel (tag RC) |
| **prod** | Production / demo | Manuel (tag release) |

Un seul environnement actif a la fois (contrainte ressources serveur).

## Methodologie

- **TDD strict** : Red → Green → Blue (commit a chaque phase)
- **Software Craftsmanship** : 1 fichier = 1 classe, SOLID, DRY, value objects, guard clauses
- **Clean Architecture** : Presentation → Application → Domain ← Infrastructure
- **Trunk-Based Development** : branches courtes (<2 jours), merge via PR
- **Conventional Commits** : `test(STN-XX):`, `feat(STN-XX):`, `refactor(STN-XX):`

## Equipe

| Nom | Profil | Role |
|---|---|---|
| Samuel Ressiot | M1 DEV | Tech lead |
| Yassine Zouitni | M1 DEV | Developpeur |
| Antony Lozano | M1 CYBER | Securisation, infra |
| Remi Reze | M1 CYBER | Audit, securite |
| Thomas Bremard | M1 CYBER | Conformite |
| Julien Volmerange | B1 | Documentation, dev |
| Mahe Pernot | B1 | Documentation, dev |

## Documentation

- [Spec technique](docs/superpowers/specs/2026-04-14-stacknest-architecture-design.md)
- [Setup self-hosted runner](docs/setup-github-runner.md)
- [Modifications cahier des charges](docs/modifications-cahier-des-charges.md)
- [Jira](https://samrst-studies.atlassian.net/jira/software/projects/EOS/boards/34)

## Licence

Projet proprietaire — EPSI OpenInnov 2025-2027.
