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

| Commande | Effet |
|---|---|
| `uv run uvicorn app.main:app --reload` | Demarre le serveur en mode dev (hot reload) |
| `uv run pytest` | Lance toute la suite de tests |
| `uv run pytest tests/unit/ -v` | Tests unitaires uniquement |
| `uv run pytest tests/integration/ -v` | Tests d'integration uniquement |
| `uv run pytest --cov=app` | Tests + rapport de couverture |
| `uv run ruff check .` | Linter (0 erreur attendue) |
| `uv run ruff format .` | Formate le code |
| `uv run mypy .` | Type checking strict (0 erreur attendue) |
| `docker run --rm -v "${PWD}":/app -w /app python:3.13-slim sh -c "pip install uv && uv sync --frozen && uv run mutmut run"` | Mutation testing (Linux/Docker — voir guide) |

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
