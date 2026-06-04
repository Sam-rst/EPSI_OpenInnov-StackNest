# @stacknest/web

Frontend SPA — React 18 + Vite + TypeScript strict + Tailwind CSS, architecture **Clean Architecture + Vertical Slicing**.

## Démarrage

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build dans dist/
npm run typecheck    # tsc --noEmit (strict)
npm run lint         # ESLint, 0 warnings tolérés
npm run test         # vitest run
npm run test:e2e     # Playwright
```

## Structure

```
src/
├── core/                # Transverse — partagé partout
│   ├── api/             # Client HTTP, ApiError
│   ├── config/          # env vars typées
│   ├── theme/           # ThemeProvider + tokens.css (light/dark)
│   ├── routing/         # AppRouter + ProtectedRoute + ROUTES const
│   ├── layout/          # AppShell (sidebar + topbar) + PublicShell
│   ├── ui/              # Primitives Button, Card, Badge, Avatar, Icon, Logo
│   ├── hooks/           # useDebounce, useMediaQuery…
│   └── utils/           # formatters, helpers purs
│
├── marketing/           # Landing publique
│   ├── pages/LandingPage.tsx
│   └── components/{Hero,PersonasCarousel,…}
│
├── auth/                # Squelette feature : domain/api/store/hooks/components/pages
├── catalog/
├── deployment/
├── dashboard/
├── chat/
├── admin/
├── settings/
│
├── App.tsx              # Providers + Router
├── main.tsx             # ReactDOM root
└── styles/globals.css
```

## Conventions

- **1 fichier = 1 composant** (PascalCase, fichier nommé comme le composant exporté)
- **Compound components** quand un composant dépasse ~100 lignes : dossier + sous-fichiers `<Name>.<Part>.tsx`
- **DTO / Model / Mapper** : DTO miroir exact API (suffixe `Dto`), Model UI enrichi (sans suffixe), Mapper dans `api/mappers/<Entity>Mapper.ts`
- **Sens des dépendances** : `pages → components → hooks → store → api → domain`. `core/` peut être importé par tout le monde, jamais l'inverse.
- **Une feature n'importe jamais une autre feature** directement — passer par un type partagé dans `core/` ou faire remonter au niveau de la page.
- **Tests** colocalisés : `Foo.unit.test.ts` à côté de `Foo.ts`, suffixes `.unit.`, `.integ.`, `.e2e.` selon le niveau.
- **Server state** : TanStack Query (cache, retry, invalidation). Pas de fetch nu dans les composants.
- **Client state** : Context API pour auth/theme. Pas de Redux.
- **Forms** : React Hook Form + Zod (schéma partagé entre validation et types).

## Ordre de port depuis `docs/reference-prototype/`

1. `core/ui/` (Button, Card, Badge, Avatar, Icon, LogoMark, LogoLockup) — squelettes déjà créés, à compléter avec les implémentations du prototype
2. `core/layout/AppShell` (sidebar + topbar)
3. `auth/` (login + AuthContext + ProtectedRoute)
4. `marketing/` (landing — gros chantier mais isolé)
5. `catalog/` → `deployment/` → `dashboard/` → `chat/` → `admin/` → `settings/`

Quand une feature est portée et testée, supprimer le fichier correspondant dans `docs/reference-prototype/`.

## Charte graphique

Tokens CSS dans [src/core/theme/tokens.css](src/core/theme/tokens.css), mappés sur `tailwind.config.ts`. Référence visuelle complète : [`StackNest — Charte graphique.pdf`](../../StackNest%20—%20Charte%20graphique.pdf) à la racine du repo.
