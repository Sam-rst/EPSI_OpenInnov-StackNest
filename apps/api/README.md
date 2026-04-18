# StackNest API (backend)

Backend FastAPI de **StackNest** (IDP) — Python 3.13, gestion des dependances par `uv`.

## Demarrage rapide

### Pre-requis

- [uv](https://docs.astral.sh/uv/) installe (`pipx install uv` ou `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Python 3.13 (uv s'en occupe via `.python-version`)

### Installation

```bash
cd apps/api
uv sync
```

### Lancer le serveur

```bash
uv run uvicorn app.main:app --reload
```

L'API demarre sur <http://localhost:8000>. Swagger sur <http://localhost:8000/docs>.

Port configurable via `PORT` (defaut 8000).

## Commandes utiles

Le projet utilise **`poethepoet`** (task runner Python) pour standardiser les
commandes — parité avec les scripts npm côté frontend. Les tâches vivent dans
`pyproject.toml` (`[tool.poe.tasks]`) et s'exécutent via `uv run poe <task>`.

### Via poe (recommandé)

| Commande | Équivalent frontend | Effet |
|---|---|---|
| `uv run poe lint` | `npm run lint` | Linter ruff, 0 erreur attendue |
| `uv run poe lint:fix` | `npm run lint:fix` | Linter + auto-fix |
| `uv run poe format:check` | `npm run format:check` | Vérifie le format (échoue si pas clean) |
| `uv run poe format` | `npm run format:write` | Applique le format (alias : `format:write`) |
| `uv run poe typecheck` | `npm run typecheck` | `mypy` en mode strict, 0 erreur attendue |
| `uv run poe test` | `npm run test` | Tous les tests + coverage (échoue si < 80%) |
| `uv run poe test:unit` | — | Uniquement `.unit.py`, pas de coverage — boucle TDD rapide |
| `uv run poe test:integ` | — | Uniquement `.integ.py` |
| `uv run poe test:coverage` | `npm run test:coverage` | Tests + rapport HTML (`htmlcov/index.html`) |
| `uv run poe e2e` | `npm run e2e` | Uniquement `.e2e.py` |
| `uv run poe test:mutation` | `npm run test:mutation` | Mutation testing (mutmut) — voir note Windows ci-dessous |
| `uv run poe build` | `npm run build` | `docker build -t stacknest-api:local .` |
| **`uv run poe check`** | **`npm run check`** | **Gate qualité complet : lint + format:check + typecheck + test. Arrête au 1er échec.** |
| `uv run poe fix` | — | Auto-fix linter + format en une commande |

**Windows + `test:mutation`** : `mutmut` ne supporte pas natif win32. Lance plutôt :
```bash
docker run --rm -v "${PWD}":/app -w /app python:3.13-slim \
  sh -c "pip install uv && uv sync --frozen && uv run mutmut run"
```

### Via uv direct (fallback)

| Commande | Effet |
|---|---|
| `uv run uvicorn app.main:app --reload` | Démarre le serveur en mode dev (hot reload) |
| `uv run pytest app/auth/` | Tous les tests d'un slice vertical (filtrage par chemin) |
| `uv run pytest -k "test_login"` | Filtre par nom de test |

## Endpoints transverses

| Endpoint | Reponse |
|---|---|
| `GET /health` | `{"status": "ok"}` — liveness probe |
| `GET /version` | `{"version", "commit", "env", "deployed_at"}` — metadonnees de build |
| `GET /docs` | Swagger UI |

## Variables d'environnement

| Variable | Defaut | Role |
|---|---|---|
| `APP_VERSION` | `0.0.0-dev` | Version applicative (injectee au build par la CI depuis `version.json`) |
| `GIT_COMMIT` | `unknown` | SHA court du commit deploye |
| `APP_ENV` | `dev` | `dev` / `test` / `preview` / `prod` |
| `DEPLOYED_AT` | `1970-01-01T00:00:00Z` | Timestamp ISO 8601 du deploiement |
| `SENTRY_DSN` | `""` | DSN Sentry. Vide -> Sentry desactive silencieusement. |

Cree un fichier `.env` a la racine de `apps/api/` pour le dev local (ignore par git).

## Architecture

Voir [docs/guide-developpeur.md](docs/guide-developpeur.md) pour la structure detaillee, la regle **1 fichier = 1 classe**, et la marche a suivre pour creer une nouvelle feature.
