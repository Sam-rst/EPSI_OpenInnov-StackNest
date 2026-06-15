# 📐 Diagrammes d'architecture — StackNest

Schémas d'architecture du projet. La **source de vérité** est le fichier Mermaid
[`architecture.mmd`](architecture.mmd) (versionné, diff-able), décliné en image éditable Excalidraw
pour le dossier de rendu et les slides.

## Schéma principal — plan de contrôle vs hôte d'exécution

```mermaid
flowchart TB
  USER["Utilisateur (navigateur)"]

  subgraph CP["Plan de controle — jamais de workload utilisateur"]
    direction TB
    UI["ui : Nginx + React SPA"]
    API["api : FastAPI"]
    WK["worker : arq"]
    DB[("db : PostgreSQL 16")]
    RD[("redis 7 : file arq + pub/sub SSE")]
  end

  subgraph EH["Hote d execution Docker — DOCKER_HOST separe"]
    direction TB
    CO["Conteneurs utilisateurs"]
    ST["Stacks docker compose"]
  end

  LLM["LLM pluggable : Ollama / OpenAI / Anthropic"]

  USER -->|HTTPS| UI
  UI -->|proxy /api| API
  API --> DB
  API -->|enqueue job| RD
  RD -.->|SSE pub/sub| API
  WK -->|consume| RD
  WK -->|Docker SDK / compose CLI| CO
  WK --> ST
  API -.->|port LLMProvider| LLM
```

> **Idée clé** : le **plan de contrôle** (api, db, redis, worker) ne fait *jamais* tourner les
> workloads utilisateurs. Le `worker` pilote un **hôte Docker séparé** via `DOCKER_HOST` (socket local
> en dev, `ssh://…` en preview/prod). Isolation par conception.

## 🎨 Obtenir / éditer la version Excalidraw

Excalidraw importe nativement le Mermaid — pas besoin de tout redessiner :

1. Ouvrir [excalidraw.com](https://excalidraw.com).
2. Menu **« + »** (en haut à gauche) → **« Mermaid to Excalidraw »**.
3. Coller le contenu de [`architecture.mmd`](architecture.mmd) → **Insert**.
4. Repositionner / coloriser selon la charte (bleu nuit `#032233`, cyan `#0d9297`, jaune `#fea21f`),
   puis **exporter** :
   - `architecture.excalidraw` (scène éditable, à committer ici) ;
   - `architecture.png` (pour le dossier de rendu / les slides).

> Toute évolution de l'archi se fait **dans `architecture.mmd`** (source versionnée), puis on
> régénère l'Excalidraw/PNG depuis cette source. On garde ainsi un diff lisible dans git.
