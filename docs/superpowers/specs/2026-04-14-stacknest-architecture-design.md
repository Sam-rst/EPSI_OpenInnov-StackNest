# StackNest — Spec technique & Brainstorming

> Document de travail consolidant toutes les decisions prises lors du brainstorming du 2026-04-14.

---

## 1. Vision projet

StackNest est une Internal Developer Platform (IDP) fonctionnant comme un guichet unique (Store). Elle permet aux equipes techniques de provisionner des ressources IT (VM, BDD, environnements) de maniere autonome via une interface web ou un chatbot IA, en utilisant Terraform (Ansible envisage en post-MVP pour la configuration).

### Equipe (7 personnes)

| Nom | Profil | Role |
|---|---|---|
| Samuel Ressiot | M1 DEV | Tech lead |
| Yassine Zouitni | M1 DEV | Developpeur |
| Antony Lozano | M1 CYBER | Securisation API, Vault, audit |
| Remi Reze | M1 CYBER | Securisation API, audit |
| Thomas Bremard | M1 CYBER | Conformite, audit code |
| Julien Volmerange | B1 | Design, tests utilisateurs |
| Mahe Pernot | B1 | Design, documentation |

### Personas

1. **Etudiant** — provisionner une BDD + infra en quelques secondes pour se concentrer sur le code
2. **Dev Senior** — instancier un sandbox isole avec BDD repliquee pour tester sans impacter le dev partage
3. **Lead Dev PME** — automatiser le deploiement d'env de test sur serveur local a budget limite

> **A completer** : objectifs, contraintes, outils quotidiens, KPIs, donnees demographiques (exigence du prof pour l'oral).

### Charte graphique

- **Fonts** : Inter/Roboto (UI), JetBrains Mono (code)
- **Couleurs** :
  - Bleu nuit : `#032233`
  - Cyan : `#0d9297`
  - Jaune (accent) : `#fea21f`
  - Erreur : `#c42b1c`
  - Succes : `#22c55e`

---

## 2. Decisions techniques validees

| Sujet | Decision | Justification |
|---|---|---|
| Structure repo | Monorepo avec CODEOWNERS | Simplicite pour 7 personnes, ownership clair par dossier/profil |
| Backend | FastAPI (Python 3.13) | Async natif (SSE, LLM streaming), Pydantic, clean archi naturelle, accessible pour cyber |
| Frontend | React + Vite + TypeScript (SPA) | Pas besoin de SSR/SEO, plus simple que Next.js, rapide pour le MVP |
| BDD | PostgreSQL 16 | Standard, robuste, support JSON pour les configs Terraform |
| IaC | Terraform — Docker provider (MVP), Proxmox provider (stretch) | Docker d'abord pour le MVP, VMs Proxmox si le temps le permet |
| Infra | VM Proxmox sur serveur d'Antony, acces VPN | Budget 0€, pas de ports ouverts sauf HTTP/SSH |
| Auth | JWT simple lot 1, MFA TOTP lot 2 | MVP rapide, MFA en evolution |
| Age minimum | 18 ans (checkbox + CGU) | Evite la mecanique de consentement parental RGPD |
| LLM | Architecture pluggable — Ollama par defaut, OpenAI fallback | Zero cout, on-premise (RGPD), fallback si surchauffe serveur |
| Temps reel | SSE (Server-Sent Events) | Unidirectionnel serveur→client, natif HTTP, FastAPI StreamingResponse |
| Queue de jobs | Redis (queue + pub/sub) | Leger, suffisant pour le MVP, pas besoin de Celery/RabbitMQ |
| CI | GitHub Actions (runner cloud) | Standard, gratuit pour les repos publics |
| CD | Self-hosted runner sur serveur Antony | Zero port entrant, le runner poll GitHub en HTTPS sortant |
| Package manager | uv | Rapide, lockfile natif, simplifie Dockerfile et DX |
| Conteneurisation | Docker Compose | Obligatoire pour la demo aux jures |
| Terraform states | Filesystem (volume Docker par deploiement) | Simple, suffisant avec un seul worker MVP |
| Admin seeding | Script CLI `create-admin` (pas de seeder auto) | Pas de credentials par defaut dans les env vars |
| Docker Compose dev | `docker-compose.yml` + `docker-compose.dev.yml` (override) | Hot reload, ports debug, volumes montes |

### Justification FastAPI vs Django (preparation oral)

| Critere | Django | FastAPI |
|---|---|---|
| Architecture | Monolithique (MTV), batteries-included | Micro-framework, clean archi libre |
| Async natif | Non (ASGI ajoute apres coup) | Oui — critique pour SSE et appels LLM streaming |
| Validation | Forms/Serializers (DRF) | Pydantic natif — reutilisable pour valider les outputs LLM |
| OpenAPI/Swagger | Via DRF, config manuelle | Auto-genere nativement |
| Performance | Sync, plus lourd | 2-3x plus rapide (benchmarks TechEmpower) |
| Clean Archi | Contre le grain de Django (couple ORM/views) | Naturel avec dependency injection |

**Argument massue** : async natif necessaire pour SSE temps reel, appels LLM streaming, orchestration Terraform non-bloquante. Django est concu pour des apps web CRUD+templates classiques.

---

## 3. Architecture Docker Compose

```
┌─────────────────────────────────────────────────────┐
│                   Docker Compose                     │
│                                                      │
│  ┌─────────┐   ┌─────────┐   ┌──────────────────┐  │
│  │   UI    │   │   API   │   │ Worker Terraform  │  │
│  │ (Nginx) │──>│(FastAPI)│──>│   (isole)         │  │
│  │  :8080  │   │  :8000  │   │                   │  │
│  └─────────┘   └────┬────┘   └──────────────────┘  │
│                     │ │                              │
│              ┌──────┘ └──────┐                       │
│              v               v                       │
│  ┌──────────────┐   ┌────────────┐                  │
│  │  PostgreSQL  │   │   Ollama   │                  │
│  │    :5432     │   │  :11434    │                  │
│  └──────────────┘   └────────────┘                  │
│                                                      │
│  ┌──────────────┐                                    │
│  │    Redis     │  (queue jobs + pub/sub SSE)       │
│  │    :6379     │                                    │
│  └──────────────┘                                    │
└─────────────────────────────────────────────────────┘
```

| Service | Image | Role |
|---|---|---|
| **ui** | Node Alpine (build Vite) + Nginx | SPA React, reverse-proxy `/api/` vers l'API |
| **api** | python:3.13-slim + uv | FastAPI — logique metier, auth, catalogue, orchestration |
| **worker** | python:3.13-slim + uv + Terraform CLI | Execute les plans Terraform, isole du web, communique via Redis |
| **db** | PostgreSQL 16 Alpine | Users, catalogue, deploiements, conversations |
| **redis** | Redis 7 Alpine | File de jobs (API→Worker) + pub/sub pour SSE temps reel |
| **ollama** | Ollama (optionnel) | LLM local, appele par l'API uniquement |

### Separation API / Worker

Un seul package Python, deux entrypoints :
- `app/main.py` → entrypoint API (FastAPI + uvicorn)
- `app/worker_main.py` → entrypoint Worker (consumer Redis + Terraform)

Partage ~70% du code (models, schemas, services metier). Seuls les points d'entree et la couche specifique (routes HTTP vs execution Terraform) different.

---

## 4. Flow principal

```
Demande utilisateur (texte libre OU selection manuelle dans le Store)
    |
    v
[API FastAPI] recoit la demande
    |
    ├── Si texte libre → appel Ollama → extraction intention structuree (JSON)
    ├── Si selection manuelle → pas besoin d'Ollama
    |
    v
[API] resout contre le catalogue, verifie RBAC/quotas
    |
    v
[API] repond avec une proposition { resources: [...] }
    |
    v
Boucle conversationnelle (client confirme ou ajuste)
    |
    v
Client valide → API cree le job dans Redis
    |
    v
[Worker] consomme le job, execute Terraform
    |
    v
[Worker] publie le statut en temps reel via Redis pub/sub
    |
    v
[API] stream SSE vers le client → UI affiche la progression
    |
    v
Deploiement termine → client recoit les acces (mot de passe affiche une seule fois)
```

### Regles de deploiement

- **Une seule instance par deploiement** (levier business pour scaler plus tard)
- **Mot de passe affiche une seule fois** a la fin du deploiement (pas stocke en clair)
- **Bouton "Regenerer le mot de passe"** dans le detail de la ressource → Terraform met a jour le container → nouveau mot de passe affiche une seule fois
- **Terraform states sur filesystem** : un dossier par deploiement (`/terraform/states/{deployment_id}/`), volume Docker persiste

### Catalogue de templates MVP

| Template | Image Docker | Categorie |
|---|---|---|
| PostgreSQL | `postgres` | database |
| MySQL | `mysql` | database |
| Redis | `redis` | cache |
| MongoDB | `mongo` | database |
| Node | `node` | runtime |
| Python | `python` | runtime |
| Nginx | `nginx` | runtime |

Chaque template propose **plusieurs versions** avec indicateurs de support :

| Statut | Badge UI | Couleur |
|---|---|---|
| LTS actif | "Recommande" | Vert |
| LTS proche fin de vie | "Fin de vie proche" | Orange |
| EOL | "Non recommande" | Rouge + warning |

La derniere version LTS est pre-selectionnee par defaut. L'utilisateur peut choisir une version EOL mais voit un avertissement explicite.

### Parametres configurables (exemple PostgreSQL)

| Parametre | Type | Requis | Defaut |
|---|---|---|---|
| database_name | string | oui | — |
| username | string | oui | — |
| password | string | oui | auto-genere |
| port | integer | non | 5432 |

### Anti-hallucination IA

```
Demande utilisateur
    |
    v
[Agent Interpreteur] — LLM traduit en intention structuree (JSON schema strict)
    |
    v
[Validateur] — Code deterministe :
    - Les ressources existent dans le catalogue
    - Les parametres sont dans les bornes autorisees
    - L'utilisateur a les permissions RBAC
    - Le plan Terraform genere est syntaxiquement valide (terraform validate)
    |
    v
Si invalide → re-prompt le LLM avec l'erreur (max 3 tentatives)
    |
    v
Si toujours invalide → fallback : selection manuelle du Store
```

**Garde-fous concrets :**
- JSON Schema force sur la sortie LLM (Pydantic valide la reponse)
- Catalogue ferme : le LLM ne peut proposer que ce qui existe en BDD
- `terraform validate` avant toute execution
- Pas d'execution sans confirmation utilisateur
- Logs de chaque echange LLM pour audit (equipe cyber)

---

## 5. Architecture backend — Vertical Slicing + Clean Architecture

```
api/
├── pyproject.toml
├── uv.lock
├── app/
│   ├── core/                    <- config, BDD, Redis, securite, dependances partagees
│   │
│   ├── auth/                    <- feature auth
│   │   ├── domain/              <- entites (User, Role), interfaces
│   │   ├── application/         <- use cases (register, login, verify_token)
│   │   ├── infrastructure/      <- repo PostgreSQL, hasher bcrypt
│   │   └── presentation/        <- routes /auth/*
│   │
│   ├── catalog/                 <- feature catalogue
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── deployment/              <- feature deploiement
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/      <- Terraform executor, Redis queue
│   │   ├── presentation/        <- routes + SSE stream
│   │   └── worker/              <- consumer Terraform (entrypoint worker)
│   │
│   ├── chat/                    <- feature chatbot IA
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/      <- connecteur Ollama/OpenAI
│   │   └── presentation/
│   │
│   ├── dashboard/               <- feature dashboard
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── main.py                  <- entrypoint API
│   └── worker_main.py           <- entrypoint Worker
```

**Regles :**
- Chaque feature ne depend que de `core/` et de ses propres couches
- Communication inter-features via les interfaces du domain, jamais par l'infra directement
- Ajouter une feature = ajouter un dossier
- Supprimer une feature = supprimer un dossier

---

## 6. Architecture frontend — React + Vite + TypeScript

```
ui/
├── package.json
├── vite.config.ts
├── src/
│   ├── core/                    <- config, client API, auth context, layout, router
│   │
│   ├── auth/                    <- feature auth
│   │   ├── components/          <- LoginForm, RegisterForm
│   │   ├── pages/               <- LoginPage, RegisterPage
│   │   ├── services/            <- authApi.ts
│   │   ├── hooks/               <- useAuth()
│   │   └── types/               <- DTOs
│   │
│   ├── catalog/                 <- feature catalogue
│   │   ├── components/          <- TemplateCard, TemplateList, ParamForm
│   │   ├── pages/               <- CatalogPage, TemplateDetailPage
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   │
│   ├── deployment/              <- feature deploiement
│   │   ├── components/          <- DeploymentStatus, ResourceProgress, SSEListener
│   │   ├── pages/               <- DeploymentPage, DeploymentDetailPage
│   │   ├── services/
│   │   ├── hooks/               <- useDeploymentStream() (SSE)
│   │   └── types/
│   │
│   ├── chat/                    <- feature chatbot
│   │   ├── components/          <- ChatWindow, MessageBubble, IntentPreview
│   │   ├── pages/               <- ChatPage
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   │
│   ├── dashboard/               <- feature dashboard
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   │
│   └── main.tsx                 <- entrypoint
```

---

## 7. Dependances

### Backend (Python 3.13 + uv)

**Core :**

| Package | Role |
|---|---|
| fastapi | Framework API |
| uvicorn | Serveur ASGI |
| pydantic + pydantic-settings | DTOs, validation, config env |
| sqlalchemy | ORM async (avec asyncpg) |
| alembic | Migrations BDD |
| asyncpg | Driver PostgreSQL async |
| redis | Queue jobs + pub/sub SSE |

**Auth :**

| Package | Role |
|---|---|
| pyjwt | JWT encode/decode |
| passlib + bcrypt | Hash mots de passe |
| pyotp | MFA TOTP (lot 2) |

**LLM :**

| Package | Role |
|---|---|
| httpx | Client HTTP async (appels Ollama/OpenAI) — pas de SDK, appel REST direct |

**Tests :**

| Package | Role |
|---|---|
| pytest | Runner de tests |
| pytest-asyncio | Tests async |
| pytest-cov | Couverture |
| httpx | Client de test pour FastAPI (AsyncClient) |
| testcontainers | E2E : vrais containers PostgreSQL/Redis pendant les tests |
| factory-boy | Factories pour generer des fixtures |

**Dev :**

| Package | Role |
|---|---|
| ruff | Linter + formatter (remplace flake8, black, isort) |
| mypy | Type checking statique |

**Non retenu :**
- Celery : trop lourd, Redis + consumer async suffit
- LangChain : abstraction massive pour un simple appel HTTP a Ollama
- SQLModel : confusion SQLAlchemy + Pydantic sans valeur ajoutee
- python-jose : over-engineering, pyjwt suffit pour JWT signe

### Frontend (React + Vite + TypeScript)

| Package | Role |
|---|---|
| react + react-dom | UI |
| react-router-dom | Routing SPA |
| axios | Client HTTP (interceptors JWT, erreurs) |
| zustand | State management client (leger, pas de boilerplate) |
| react-hook-form + zod | Formulaires + validation |
| tailwindcss | Styling utilitaire + charte graphique |
| @tanstack/react-query | Cache serveur, polling, state async |
| vitest | Tests unitaires (natif Vite) |
| @testing-library/react | Tests de composants |
| playwright | Tests E2E (navigateur reel) |
| eslint + prettier | Lint + format |

---

## 8. Schema relationnel — MVP

### Tables

```
┌──────────────┐       ┌───────────────────┐       ┌──────────────────────┐
│    users     │       │   deployments     │       │ deployment_resources  │
├──────────────┤       ├───────────────────┤       ├──────────────────────┤
│ id (uuid)    │──┐    │ id (uuid)         │──┐    │ id (uuid)            │
│ email        │  │    │ user_id (fk)      │  │    │ deployment_id (fk)   │
│ name         │  │    │ status (enum)     │  │    │ template_id (fk)     │
│ password_hash│  └───>│ created_at        │  └───>│ template_version_id  │
│ role (enum)  │       │ updated_at        │       │ status (enum)        │
│ is_active    │       │ error_message     │       │ config_params (json) │
│              │       │                   │       │ connection_info      │
│ created_at   │       └───────────────────┘       │ created_at           │
│ updated_at   │                                    │ destroyed_at         │
└──────────────┘                                    └──────────────────────┘

┌──────────────────┐       ┌───────────────────┐
│   templates      │       │ template_versions │
├──────────────────┤       ├───────────────────┤
│ id (uuid)        │──┐    │ id (uuid)         │
│ name             │  └───>│ template_id (fk)  │
│ description      │       │ tag               │  (ex: "16-alpine")
│ category (enum)  │       │ version           │  (ex: "16")
│ default_ports    │       │ is_lts            │
│ is_active        │       │ eol_date          │  (nullable)
│ created_at       │       │ is_default        │
└──────────────────┘       │ created_at        │
                           └───────────────────┘

┌──────────────────┐       ┌───────────────────┐
│ template_params  │       │  chat_sessions    │
├──────────────────┤       ├───────────────────┤
│ id (uuid)        │       │ id (uuid)         │──┐
│ template_id (fk) │       │ user_id (fk)      │  │
│ name             │       │ deployment_id(fk) │  │
│ type (enum)      │       │ status (enum)     │  │
│ default_value    │       │ created_at        │  │
│ required         │       │ closed_at         │  │
└──────────────────┘       └───────────────────┘  │
                                                   │
                           ┌───────────────────┐   │
                           │  chat_messages    │   │
                           ├───────────────────┤   │
                           │ id (uuid)         │   │
                           │ session_id (fk)   │◀──┘
                           │ role (enum)       │
                           │ content           │
                           │ structured_intent │
                           │ created_at        │
                           └───────────────────┘
```

L'image Docker se construit a partir du nom du template + le tag de la version : `postgres` + `16-alpine` → `postgres:16-alpine`.

### Enums

| Enum | Valeurs |
|---|---|
| user_role | `admin`, `user` |
| deployment_status | `pending`, `provisioning`, `running`, `failed`, `destroying`, `destroyed` |
| resource_status | `pending`, `creating`, `ready`, `error`, `destroying`, `destroyed` |
| template_category | `database`, `cache`, `runtime`, `messaging` |
| param_type | `string`, `integer`, `boolean` |
| chat_status | `active`, `confirmed`, `cancelled` |
| message_role | `user`, `assistant` |

### Relations cles

- **templates** → **template_versions** : un template a plusieurs versions (PostgreSQL 14, 15, 16...)
- **templates** → **template_params** : un template a plusieurs parametres configurables
- **deployments** → **deployment_resources** : un deploiement a une ressource (1 instance par deploiement MVP)
- **deployment_resources** → **template_versions** : chaque ressource reference la version choisie
- **chat_sessions** → **deployments** : une session chat peut aboutir a un deploiement
- Image Docker = `templates.name` + `template_versions.tag` (ex: `postgres` + `16-alpine` → `postgres:16-alpine`)

### Reporte au post-MVP

- Table `audit_logs` — logging fichier pour le MVP, table dediee en lot 2
- Table `quotas` — pas de gestion de quotas au MVP
- Table `costs` — dashboard couts en Could (MoSCoW)
- Table `mfa_secrets` — MFA en lot 2

---

## 9. MoSCoW — Priorisation des features

### Must (sans ca, pas de demo)

| Feature | Domaine |
|---|---|
| Catalogue de templates Docker (PostgreSQL, MySQL, Redis, MongoDB, Node, Python, Nginx) | Store |
| Gestion des versions par template avec indicateurs LTS/EOL | Store |
| Selection manuelle d'une ressource (1 instance par deploiement) | Store |
| Detail d'un template (description, versions, ports, params configurables) | Store |
| Worker Terraform qui provisionne des containers Docker | Deploiement |
| Suivi temps reel du deploiement (SSE) | Deploiement |
| Rollback automatique en cas d'echec | Deploiement |
| Mot de passe affiche une seule fois + bouton regenerer | Deploiement |
| Inscription / login (email + mot de passe + JWT, access 15min + refresh 7j) | Auth |
| RBAC 2 roles (admin / user) | Auth |
| Script CLI `create-admin` | Auth |
| Docker Compose de dev + override dev (hot reload) | Infra |
| Pipeline CI GitHub Actions (lint, tests, build) | Infra |
| CD self-hosted runner | Infra |
| Tests automatises (80% global, 90% logique metier) | Qualite |

### Should (ameliore fortement la demo — Phase 3)

| Feature | Domaine |
|---|---|
| Combinaisons de ressources dans une seule demande | Store |
| Historique des deploiements | Deploiement |
| Annulation / suppression d'un deploiement | Deploiement |
| MFA (TOTP) | Auth |
| Endpoint chat : texte libre → intention structuree via Ollama | Chat |
| Boucle conversationnelle (proposition → ajustement → validation) | Chat |
| Architecture pluggable LLM (Ollama/OpenAI) | Chat |
| Validation stricte des configs generees par l'IA | Chat |
| Liste des ressources deployees (statut, date, owner) | Dashboard |
| Detail d'une ressource (logs, connection string) | Dashboard |
| User doc integree a l'app (catalogue markdown) | Documentation |
| Pages login/register frontend (si B1 prets) | Auth |

### Could (stretch goal — Phase 4)

| Feature | Domaine |
|---|---|
| Estimation de cout / ressources consommees | Store |
| Terraform Proxmox provider (vraies VMs) | Deploiement |
| OAuth2/OIDC (Keycloak) | Auth |
| Gestion des quotas par utilisateur | Auth |
| Historique des conversations | Chat |
| Vue des couts / consommation | Dashboard |
| SonarCloud integre | Infra |

### Won't (hors scope)

| Feature | Domaine |
|---|---|
| Templates custom (upload d'images Docker) | Store |
| Metriques CPU/RAM des containers (monitoring) | Dashboard |

---

## 10. CI/CD

### Pipeline CI (GitHub Actions — runner cloud)

```
Push/PR → Lint (ruff + eslint) → Tests (>= 80% coverage) → Build → [SonarCloud si Could]
```

### Pipeline CD (Self-hosted runner sur serveur Antony)

```
Merge sur develop/main → CI verte → CD (self-hosted runner) :
    docker compose pull && docker compose up -d
```

- Runner en container Docker sur le serveur d'Antony
- Zero port entrant (long-polling HTTPS sortant vers GitHub)
- Documentation d'installation : `docs/setup-github-runner.md`

### Gitflow

- **main** : production — deploy apres CI verte
- **preview/staging** : pre-production — deploy apres CI verte
- **develop** : developpement — CI only
- **feature/EOS-XX-description** : branches de travail
- **bugfix/EOS-XX-description** : corrections
- Commits en francais, reference ticket Jira (EOS-XX)
- Jamais de commit direct sur main/develop/staging
- Jamais de Co-Authored-By

### Versioning SemVer

- 0.x.y en developpement, 1.0.0 au premier lancement public
- PATCH avant MINOR (bugfixes avant features)
- Version centralisee dans `version.json` synchee dans les package.json/pyproject.toml

---

## 11. RGPD

### Donnees collectees

- **Email professionnel** + **Nom** — c'est tout
- **Pas d'IP stockee** — rate limiting par user authentifie
- **Age minimum 18 ans** — checkbox a l'inscription + CGU

### Privacy by design

- Ollama on-premise par defaut (donnees ne quittent pas le serveur)
- Si fallback OpenAI : avertir l'utilisateur que les donnees transitent vers un tiers
- Logs anonymises par defaut
- Pas de tracking superflu

### Privacy by default

- Compte cree avec permissions minimales (role `user`)
- Pas de collecte au-dela du strict necessaire

### Conservation des donnees

- Logs de deploiement : 12 mois
- Conversations chatbot : 6 mois
- Compte inactif : purge apres 24 mois

### Droit a l'oubli

- Endpoint `DELETE /users/{id}` qui cascade sur toutes les donnees (deploiements, conversations, logs)

---

## 12. Decoupage des tickets Jira

### Auth

| # | Ticket | Scope | Assignation |
|---|---|---|---|
| 1 | Inscription utilisateur (email + nom + mdp) | Endpoint `POST /auth/register`, validation Pydantic, hash bcrypt, stockage BDD | Dev |
| 2 | Login + generation JWT | Endpoint `POST /auth/login`, verification mdp, retour access token + refresh token | Dev |
| 3 | Middleware auth + refresh token | Verification JWT sur les routes protegees, refresh automatique | Dev |
| 4 | RBAC (admin/user) | Decorateur/dependance FastAPI qui verifie le role | Dev |
| 4b | Script CLI create-admin | Commande `uv run python -m app.cli create-admin` avec input interactif du mot de passe | Dev |
| 5 | Page login/register frontend | Formulaires react-hook-form + zod, appel API, stockage token, redirect | Dev (ou B1 si montee en competences concluante) |
| 6 | Route guard frontend | Composant `ProtectedRoute` qui redirige vers login si pas de token valide | Dev (ou B1 si montee en competences concluante) |
| 7 | MFA TOTP (lot 2) | Generation secret, QR code, verification code a 6 chiffres (pyotp) | Dev + Cyber |
| 8 | Audit securite auth | Review du flow auth, verification failles (brute force, timing attack, token storage) | Cyber |

### Catalogue

| # | Ticket | Scope | Assignation |
|---|---|---|---|
| 9 | Modele + migration templates | Tables `templates` + `template_versions` + `template_params`, migration Alembic, seeder avec templates de base | Dev |
| 9b | Maintenance catalogue versions | Veille des EOL, mise a jour des badges LTS/EOL, audit CVE par version | Cyber |
| 10 | CRUD templates (admin) | Endpoints `GET/POST/PUT/DELETE /catalog/templates`, reserve admin | Dev |
| 11 | Liste des templates (user) | Endpoint `GET /catalog/templates` filtre par categorie, pagine | Dev |
| 12 | Detail d'un template | Endpoint `GET /catalog/templates/{id}` avec ses params configurables | Dev |
| 13 | Page catalogue frontend | Grille de TemplateCards, filtres par categorie, recherche | Dev |
| 14 | Page detail template frontend | Description, parametres configurables, bouton "Deployer" | Dev |
| 15 | Templates Docker de base | Ecrire les templates : PostgreSQL, MySQL, Redis, MongoDB, Node, Python, Nginx (avec versions multiples + indicateurs LTS/EOL) | Dev + Cyber |

### Deploiement

| # | Ticket | Scope | Assignation |
|---|---|---|---|
| 16 | Modele + migration deployments | Tables `deployments` + `deployment_resources` (avec `template_version_id`), migration Alembic | Dev |
| 17 | Endpoint creation de deploiement | `POST /deployments` — valide la demande, cree en BDD, enqueue dans Redis | Dev |
| 18 | Worker Terraform — consumer Redis | Process qui consomme les jobs, genere les fichiers `.tf`, execute `terraform init/plan/apply` | Dev |
| 19 | Generation dynamique des fichiers Terraform | Transformer un template + params en fichier `.tf` valide (Docker provider) | Dev |
| 20 | Remontee statut temps reel (SSE) | Worker publie dans Redis pub/sub, API stream via `GET /deployments/{id}/stream` | Dev |
| 21 | Rollback automatique en cas d'echec | Si `terraform apply` echoue, executer `terraform destroy` sur le state partiel | Dev |
| 22 | Historique des deploiements | Endpoint `GET /deployments` (mes deploiements), `GET /deployments` admin (tous) | Dev |
| 23 | Suppression d'un deploiement | `DELETE /deployments/{id}` — lance `terraform destroy`, met a jour le statut | Dev |
| 23b | Regeneration mot de passe | `POST /deployments/{id}/resources/{rid}/regenerate-password` — Terraform met a jour le container, nouveau mdp affiche une seule fois | Dev |
| 24 | Page deploiement frontend | Formulaire de config, lancement, barre de progression SSE temps reel | Dev |
| 25 | Page historique frontend | Liste des deploiements, statut, actions (detail, supprimer) | Dev |
| 26 | Audit securite Terraform | Review isolation worker, gestion du state, secrets Terraform, permissions Docker socket | Cyber |

### Chat IA (Phase 3)

| # | Ticket | Scope | Assignation |
|---|---|---|---|
| 27 | Connecteur LLM pluggable | Interface abstraite + implementations Ollama et OpenAI (httpx) | Dev |
| 28 | Endpoint chat | `POST /chat/sessions/{id}/messages` — envoie au LLM, retourne intention structuree | Dev |
| 29 | Validation deterministe des intentions | Pydantic valide le JSON LLM, verifie contre le catalogue, retry si invalide (max 3) | Dev |
| 30 | Boucle conversationnelle | Gestion du contexte de session, proposition → ajustement → validation → trigger deploiement | Dev |
| 31 | Modele + migration chat | Tables `chat_sessions` + `chat_messages`, migration Alembic | Dev |
| 32 | Page chat frontend | ChatWindow, MessageBubble, IntentPreview (preview de ce que l'IA propose), bouton confirmer | Dev |
| 33 | Audit prompts IA | Verifier que les prompts ne leakent pas de donnees sensibles, tester les injections de prompt | Cyber |

### Dashboard

| # | Ticket | Scope | Assignation |
|---|---|---|---|
| 34 | Endpoint stats utilisateur | `GET /dashboard/stats` — nombre de deploiements, ressources actives, par categorie | Dev |
| 35 | Page dashboard frontend | Vue d'ensemble : ressources actives, derniers deploiements, statuts | Dev |
| 36 | Detail d'une ressource | Connection string, ports, logs, date de creation, bouton supprimer | Dev |

### Documentation in-app (B1)

| # | Ticket | Scope | Assignation |
|---|---|---|---|
| 37 | Endpoint API docs utilisateur | `GET /api/docs/guides`, `GET /api/docs/guides/{slug}` — lit les fichiers markdown | B1 |
| 38 | Composant React rendu markdown | Page `/docs`, liste des guides, rendu markdown stylise (react-markdown) | B1 |
| 39 | Redaction des guides | Guide demarrage, guide deploiement, guide chatbot, FAQ | B1 |
| 40 | Design et integration UI | Maquettes Figma des pages principales, integration charte graphique Tailwind | B1 |

### Infra / CI-CD

| # | Ticket | Scope | SP | Assignation |
|---|---|---|---|---|
| 41 | Docker Compose de dev + override | `docker-compose.yml` + `docker-compose.dev.yml` : volumes montes, hot reload (uvicorn --reload, Vite HMR), ports debug | 2 | Dev |
| 42 | Pipeline CI GitHub Actions | Workflow : lint (ruff + eslint) → tests (pytest + vitest) → build → coverage gate | 3 | Dev |
| 43 | Pipeline CD self-hosted runner | Job CD sur label `self-hosted,stacknest`, docker compose pull + up | 3 | Dev |
| 44 | Installation runner sur serveur | Mise en place du self-hosted runner Docker sur la VM Proxmox d'Antony | 2 | Cyber (Antony) |
| 45 | Configuration Nginx reverse proxy | Nginx sur le serveur : SSL, routing `/api/`, headers securite | — | Cyber |
| 46 | Gestion des secrets | Variables d'env chiffrees, GitHub secrets par environnement (develop, staging, prod) | 2 | Cyber |
| 47 | Audit securite infra | Scan des images Docker, review des ports exposes, permissions, reseau | — | Cyber |
| 48 | Scaffolding backend FastAPI | pyproject.toml, uv, archi verticale (core/ + features vides), ruff, mypy, pytest, Dockerfile, endpoint GET /health | 2 | Dev |
| 49 | Scaffolding frontend React | Vite, TypeScript, Tailwind (charte graphique), ESLint, Prettier, Vitest, Playwright, archi verticale (core/ + features vides) | 2 | Dev |
| 50 | Configuration des 3 environnements | docker-compose.{dev,preview,prod}.yml, script start/stop, pipeline CD par branche, Nginx par env | 3 | Dev |

### Repartition par profil

| Profil | Tickets | Total |
|---|---|---|
| Dev (Samuel + Yassine) | 1-6, 4b, 9-25, 23b, 27-32, 34-36, 41-43, 48-49 | ~38 |
| Cyber (Antony, Remi, Thomas) | 7, 8, 9b, 15, 26, 33, 44-47 | ~10 |
| B1 (Julien, Mahe) | 37-40 (+5, 6 si montee en competences OK) | 4-6 |

### Planning des versions (sprints d'une semaine, dimanche a dimanche)

| Version | Contenu | SP | Sprint |
|---|---|---|---|
| **v0.1.0** | Setup projet (infra, frameworks, archi, envs, docs, regles) | 14 | 14-19 avril |
| **v0.2.0** | Store complet (modele templates + CRUD + front) | 16 | 19-26 avril |
| **v0.3.0** | Terraform worker (modele deployments + worker + generation) | 16 | 26 avril - 3 mai |
| **v0.4.0** | SSE + frontend deploiement + rollback | 14 | 3-10 mai |
| **v0.5.0** | Auth complete (back + front + modele User) | 16 | 10-17 mai |
| **v0.6.0** | Historique + suppression + gestion ressources | 10 | 17-24 mai |
| **v0.7.0** | Chat IA backend (modele chat + connecteur + validation) | 16 | 24-31 mai |
| **v0.8.0** | Chat frontend + dashboard basique | 12 | 31 mai - 7 juin |
| | **Preparation oral + video demo + bugfixes** | — | 7-16 juin (oral le 16) |
| **v0.9.0** | Post-jury (dashboard complet, MFA, audits, docs B1) | — | Sept 2026+ |

**Detail par version :**

**v0.1.0 — Setup projet (14 SP) — 14-19 avril**
Tickets : #41 (2), #42 (3), #44 (2), #48 (2), #49 (2), #50 (3)
Livrable : repo structure, Docker Compose fonctionnel, 3 envs (develop/preview/prod) avec start/stop, CI qui tourne, hot reload, GET /health, version.json
Environnements : develop tourne en permanence sur le serveur d'Antony, preview/prod a la demande (start/stop). Tout accessible via VPN equipe.

**v0.2.0 — Store (16 SP) — 19-26 avril**
Tickets : #9 (3), #15 (2), #10 (2), #11 (1), #12 (1), #13 (3), #14 (3), #46 (2) [total: 17, ajuster si besoin]
Livrable : catalogue navigable, templates avec versions LTS/EOL

**v0.3.0 — Terraform worker (16 SP) — 26 avril - 3 mai**
Tickets : #16 (3), #17 (3), #18 (5), #19 (5)
Livrable : backend provisionne des containers Docker via Terraform

**v0.4.0 — SSE + frontend deploiement (14 SP) — 3-10 mai**
Tickets : #20 (3), #21 (5), #43 (3), #24 (5) [total: 16, ajuster si besoin]
Livrable : **MVP demonstrable** — deploiement depuis l'UI avec suivi temps reel

**v0.5.0 — Auth (16 SP) — 10-17 mai**
Tickets : #1 (2), #2 (2), #3 (3), #4 (3), #4b (1), #5 (3), #6 (2)
Livrable : inscription, login, JWT, RBAC, pages login/register, route guard. Toutes les routes existantes sont protegees.

**v0.6.0 — Historique + gestion (10 SP) — 17-24 mai**
Tickets : #22 (1), #23 (3), #23b (3), #25 (3)
Livrable : gestion complete des deploiements (voir, supprimer, regenerer mdp)

**v0.7.0 — Chat IA backend (16 SP) — 24-31 mai**
Tickets : #31 (2), #27 (3), #28 (3), #29 (5), #30 (3)
Livrable : chatbot fonctionnel cote API avec validation anti-hallucination

**v0.8.0 — Chat frontend + dashboard (12 SP) — 31 mai - 7 juin**
Tickets : #32 (5), #34 (1), #35 (3), #36 (3)
Livrable : **feature-complete pour la demo jury**

**v0.9.0 — Post-jury — Sept 2026+**
Tickets : #7, #8, #9b, #26, #33, #37-40, #45, #47

---

## 13. Business & Cahier des charges

### Pricing (cahier des charges uniquement, pas implemente dans le MVP)

| Offre | Prix | Contenu |
|---|---|---|
| **Free** | 0€ | 1 projet, 2 ressources max, templates de base, pas de chatbot IA |
| **Pro** | ~15€/mois | Projets illimites, toutes les ressources, chatbot IA, support prioritaire |
| **Enterprise** | Sur devis | Deploiement on-premise, SLA, support dedie, audit securite |

Periode de test : 14 jours Pro gratuit. Cles de licence generees a l'inscription, liees au compte, duree = abonnement actif.

### Personas detailles

**Lucas, 21 ans — Etudiant en informatique (L3/M1)**
- **Objectif** : provisionner une BDD + runtime en < 2 minutes pour ses projets de cours
- **Contraintes** : budget 0€, pas de connaissances infra/DevOps, veut se concentrer sur le code
- **Outils quotidiens** : VS Code, GitHub, Terminal, Docker Desktop (basique)
- **KPIs** : temps de provisionnement < 2min (vs ~30min manuellement), 0 commande infra tapee

**Sarah, 32 ans — Dev senior (startup SaaS, 15 devs)**
- **Objectif** : instancier un sandbox isole avec BDD repliquee pour tester une migration sans impacter l'equipe
- **Contraintes** : 15 devs partagent un env de dev, pas d'acces admin cloud, doit attendre les Ops
- **Outils quotidiens** : IntelliJ, Jira, GitLab CI, Slack, Datadog
- **KPIs** : delai de provisionnement de 3 jours (ticket Ops) → 5 minutes, 0 ticket Ops cree

**Marc, 38 ans — Lead dev PME (8 devs)**
- **Objectif** : automatiser le deploiement d'envs de test sur serveur local avec budget limite
- **Contraintes** : pas de budget cloud (< 50€/mois), un seul serveur physique, pas d'equipe Ops dediee
- **Outils quotidiens** : GitHub, Docker Compose, Terraform (basique), Proxmox
- **KPIs** : cout infra de 200€/mois (cloud) → 50€/mois (self-hosted), temps setup env de 2h → 10min

### Benchmark concurrence

| Concurrent | Type | Prix | Forces | Faiblesses vs StackNest |
|---|---|---|---|---|
| Heroku | PaaS cloud | 5-50$/mois | Simple, ecosysteme mature | Pas self-hosted, couteux, pas d'IaC |
| Railway | PaaS cloud | 5-20$/mois | DX moderne, deploy Git | Pas self-hosted, vendor lock-in |
| Render | PaaS cloud | 0-19$/mois | Bon free tier, simple | Pas self-hosted, limite en IaC |
| Portainer CE | Self-hosted | Gratuit / 15$/noeud | Docker management complet | Pas d'IA, pas de catalogue, UI complexe |
| Coolify | Self-hosted | Gratuit / 5$/mois | Open source, simple | Pas d'IA, pas de Terraform |
| Backstage | IDP open source | Gratuit | Standard IDP, plugins | Tres complexe, pas de provisionnement natif |

**Positionnement** : les PaaS cloud facturent 5-50€/mois/service. StackNest self-hosted = cout du serveur uniquement.

### Livrables

| Lot | Livrable |
|---|---|
| 1 | Applicatif StackNest (SPA + API + Worker + Docker Compose) |
| 2 | Site vitrine (landing page statique) |
| 3 | Modules Terraform (bibliotheque de templates Docker) |
| 4 | Documentation technique (README, spec, architecture, installation) |
| 5 | Documentation utilisateur (guides in-app) |
| 6 | Video demo (scenario chatbot deployant une infrastructure) |

### Roadmap

Sprints d'une semaine (dimanche a dimanche). Oral le 16 juin 2026, feature freeze le 7 juin.

| Phase | Periode | Versions | Contenu |
|---|---|---|---|
| Phase 1 | 14-19 avril 2026 | v0.1.0 | Setup projet complet + 3 environnements |
| Phase 2 | 19 avril - 10 mai | v0.2.0, v0.3.0, v0.4.0 | Store + Terraform + deploiement (MVP) |
| Phase 3 | 10-24 mai | v0.5.0, v0.6.0 | Auth + historique/gestion |
| Phase 4 | 24 mai - 7 juin | v0.7.0, v0.8.0 | Chat IA + Dashboard |
| Prep oral | 7-16 juin | — | Video demo, slides, entrainement |
| Phase 5 | Sept 2026+ | v0.9.0+ | MFA, Proxmox, site vitrine, audits, docs B1 |
| Phase 6 | Jan-Juin 2027 | v1.0.0 | Beta testing, commercialisation |

**Jalons :** MVP demonstrable a la v0.4.0 (10 mai). Feature-complete a la v0.8.0 (7 juin). Oral le 16 juin.

**Environnements :** develop tourne en permanence sur le serveur d'Antony (acces VPN equipe). Preview et prod lances a la demande (start/stop) pour les livraisons de version. Un seul env non-develop actif a la fois (contrainte ressources serveur).

### Reponses aux questions techniques du prof

**n8n comme orchestrateur IA :**
Evalue et non retenu pour le MVP. Notre pipeline maison (LLM → validation Pydantic → Terraform) est plus simple, testable en TDD, et ne necessite pas de service supplementaire. n8n reste une option pour la Phase 4-5 si la complexite des workflows IA augmente.

**Gemini + GCP :**
L'architecture pluggable permet d'ajouter Gemini comme provider LLM au meme titre qu'OpenAI, sans changer le code metier. Pas besoin de GCP, l'API Gemini est accessible directement. En Could pour un futur lot.

**Agents IA specialises (CrewAI, SMA) :**
Pour le MVP, le pattern "LLM → validation deterministe → retry" suffit. Si un seul LLM ne produit pas des resultats assez fiables, on peut evoluer vers du multi-agents en Phase 4-5. L'architecture verticale du module chat/ permet cette evolution sans refactoring.

**Maintenance applicative des infras deployees :**
MVP : l'utilisateur peut deployer et supprimer ses ressources. Pas de mise a jour automatique. v1.0 : alertes quand une version deployee passe en EOL + bouton de mise a jour de version.

**Securisation :**
- Auth JWT + RBAC des le MVP, MFA en lot 2
- Terraform states isoles par deploiement (pas d'acces croise)
- Worker isole du web (pas d'acces direct depuis l'exterieur)
- Ollama on-premise (donnees ne quittent pas le serveur)
- Audit securite par l'equipe cyber sur chaque composant
