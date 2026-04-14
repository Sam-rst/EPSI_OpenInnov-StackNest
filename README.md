# StackNest - Étape 2 (UI + API proxy + webhook n8n)

Cette version connecte l'interface StackNest à une API locale Node.js/Express qui relaie le déploiement vers un webhook n8n.

## Prérequis

- Docker
- Docker Compose (commande `docker compose`)

## Structure du projet

- `ui/index.html` : interface StackNest (inchangée)
- `ui/styles.css` : charte graphique StackNest
- `ui/app.js` : appel réel `POST /api/deploy` (même origine)
- `ui/nginx.conf` : serveur statique + proxy `/api/` vers `api:3001`
- `api/server.js` : API Express (`GET /health`, `POST /deploy`)
- `api/package.json` : dépendances API
- `api/Dockerfile` : image API
- `docker-compose.yml` : orchestration UI + API
- `.env.example` : variables d'environnement à copier

## Configuration

1. Copier le fichier d'exemple:

```bash
cp .env.example .env
```

2. Renseigner `.env` à la racine du projet (même niveau que `docker-compose.yml`).
3. Ne pas commiter `.env` (il contient des secrets potentiels).

Variables :

- `N8N_WEBHOOK_URL` (obligatoire)
- `N8N_TOKEN` (optionnel, transmis en header `x-deploy-token`)
- `PORT` (optionnel, défaut `3001`)
- `DEBUG_ENV` (optionnel: `1` pour activer `GET /debug/env`)

## Lancement

Depuis la racine du projet:

```bash
docker compose up --build
```

Application disponible sur:

- http://localhost:8080

Commandes Windows utiles (PowerShell / Docker Desktop):

```bash
docker compose down
docker compose up -d --build
docker compose exec api sh -lc "env | grep -E '^N8N_'"
```

## Endpoints disponibles

- `GET /api/health` -> `{ "ok": true }`
- `POST /api/deploy` -> relaie `{ template, count }` vers n8n et renvoie la réponse JSON

Vérification de base:

- http://localhost:8080/api/health doit répondre `{ "ok": true }`

## Exemples de test curl

Via nginx (recommandé):

```bash
curl -X POST http://localhost:8080/api/deploy \
  -H "Content-Type: application/json" \
  -d '{"template":"ubuntu","count":1}'
```

Si vous publiez temporairement le port API dans `docker-compose.yml` (ex: `3001:3001`):

```bash
curl -X POST http://localhost:3001/deploy \
  -H "Content-Type: application/json" \
  -d '{"template":"ubuntu","count":1}'
```

## Logo

Le logo doit être placé ici:

- `ui/assets/stacknest-logo.png`

Si absent, l'interface affiche le fallback texte `StackNest`.
