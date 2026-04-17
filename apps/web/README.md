# StackNest — Web (frontend React + Vite)

SPA React + TypeScript + Vite pour l'IDP StackNest. L'UI est en français.

## Prérequis

- Node.js 20+ (https://nodejs.org)
- npm 10+

## Installation

```bash
cd apps/web
npm install
cp .env.example .env
```

## Variables d'environnement

| Variable           | Description                           | Valeurs                             |
| ------------------ | ------------------------------------- | ----------------------------------- |
| `VITE_API_URL`     | URL du backend FastAPI                | `http://localhost:8000` en dev      |
| `VITE_ENVIRONMENT` | Environnement affiché dans le bandeau | `dev` / `test` / `preview` / `prod` |
| `VITE_SENTRY_DSN`  | DSN Sentry (optionnel)                | Vide = monitoring désactivé         |

## Commandes

```bash
npm run dev            # Vite dev server (http://localhost:5173) + HMR
npm run build          # Build production dans dist/
npm run preview        # Sert le build
npm run lint           # ESLint — 0 erreur attendu
npm run lint:fix       # ESLint avec autofix
npm run format         # Prettier — formate tout
npm run format:check   # Prettier — vérifie le format
npm run typecheck      # tsc --noEmit
npm run test           # Vitest (unit + integration)
npm run test:watch     # Vitest en mode watch
npm run test:coverage  # Couverture v8
npm run e2e            # Playwright (tests end-to-end)
```

## Structure

```
src/
├── core/                           # Config, API, router, layout, components partagés
│   ├── api/axios-instance.ts       # Factory axios avec intercepteurs
│   ├── components/
│   │   ├── EnvironmentBanner.tsx   # Bandeau env (dev/test/preview)
│   │   ├── ErrorBoundary.tsx       # Boundary racine
│   │   ├── HomePage.tsx
│   │   └── Layout.tsx
│   ├── stores/ui.store.ts          # Store zustand UI (sidebar, etc.)
│   ├── router.tsx                  # createBrowserRouter
│   └── sentry.ts                   # initSentry conditionnel
├── auth/                           # Feature auth (vide, archi complète)
├── catalog/
├── chat/
├── dashboard/
├── deployment/
├── App.tsx                         # ErrorBoundary > Banner > RouterProvider
└── main.tsx                        # Entrée, initSentry + createRoot
```

Chaque feature suit la **Clean Architecture vertical slicing** avec les sous-dossiers `types/{dto,models,enums,guards}`, `mappers/`, `services/`, `hooks/`, `components/`, `pages/`.

## Conventions

- **1 fichier = 1 composant / 1 type / 1 hook**
- **Séparation DTO (snake_case miroir API) / Model (camelCase UI)** via mappers
- **TDD strict** Red → Green → Blue (voir [`docs/guide-developpeur.md`](docs/guide-developpeur.md))
- **Conventions de tests** : `*.unit.test.ts(x)`, `*.integ.test.ts(x)`, `tests/e2e/*.spec.ts`
- **Commits en français** référençant `STN-XX`

## Docker

```bash
docker build -t stacknest-web .
docker run -p 8080:80 stacknest-web
```

L'image multi-stage build avec Node 20 puis sert la SPA via Nginx (avec reverse-proxy `/api/` vers le backend).

## Docs

- [Guide développeur](docs/guide-developpeur.md) — architecture, DTO/Mapper/Model, compound components, créer une feature
