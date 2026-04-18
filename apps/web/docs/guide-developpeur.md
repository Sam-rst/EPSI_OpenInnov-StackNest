# Guide développeur — apps/web

Ce guide documente les conventions d'architecture du frontend StackNest. Toute nouvelle feature doit les respecter.

## 1. Principes

- **Clean Architecture vertical slicing** : chaque feature est autonome (exemples : `auth/`, `catalog/`, `chat/`, `dashboard/`, `deployment/`) et ne dépend que de `core/`. Les features sont créées **à la demande au fil des sprints** — ne jamais pré-créer les dossiers vides.
- **1 fichier = 1 composant / 1 type / 1 hook**. Pas de fichier "fourre-tout".
- **Séparation DTO / Model** : les DTO sont le miroir exact de l'API (snake_case, types primitifs), les Models sont la représentation UI enrichie (camelCase, `Date`, computed fields). Les mappers font le pont.
- **Container / Presentational** : les `pages/` orchestrent (data fetching, état), les `components/` affichent.
- **Compound components** : dès qu'un composant dépasse ~100 lignes, on éclate en sous-dossier avec plusieurs fichiers + `index.ts` qui re-exporte.
- **États requis** : chaque requête doit exposer `Skeleton`, `Empty`, `Error`, en plus de l'état nominal.
- **Error Boundary par feature** (en plus de celle racine dans `App.tsx`).

## 2. Structure d'une feature

```
<feature>/
├── types/
│   ├── dto/         # Miroir API, snake_case (ex: UserDto)
│   ├── models/      # UI, camelCase, enrichi (ex: UserModel)
│   ├── enums/       # as const + type dérivé
│   └── guards/      # Type guards runtime pour valider les DTO
├── mappers/         # dto <-> model (ex: user.mapper.ts)
├── services/        # Appels API (utilisent core/api/axios-instance)
├── hooks/           # React Query hooks exposant des Models
├── components/      # Presentational (reçoivent des Models en props)
└── pages/           # Containers (routes)
```

## 3. Flux de données

**Lecture** :

```
API → Service (DTO) → Mapper → Model → Hook (React Query) → Component
```

**Écriture** :

```
Form (Model) → Mapper → DTO → Service → API
```

Exemple :

```typescript
// types/dto/user.dto.ts
export type UserDto = {
  id: string
  full_name: string
  created_at: string // ISO string
}

// types/models/user.model.ts
export type UserModel = {
  id: string
  fullName: string
  createdAt: Date
}

// mappers/user.mapper.ts
export const userMapper = {
  toModel: (dto: UserDto): UserModel => ({
    id: dto.id,
    fullName: dto.full_name,
    createdAt: new Date(dto.created_at),
  }),
}
```

## 4. TDD Red → Green → Blue

Obligatoire pour tout nouveau code.

1. **Red** : écrire le test qui échoue d'abord.
2. **Green** : implémentation minimale pour le faire passer.
3. **Blue** : refactor (naming explicite, fonctions <= 20 lignes, early return, extraire value objects…).

Conventions :

- `*.unit.test.tsx` — tests unitaires (isolés, rapides)
- `*.integ.test.tsx` — tests d'intégration (MSW, plusieurs composants)
- `tests/e2e/*.spec.ts` — tests Playwright

Lancer :

```bash
npm run test               # unit + integ
npm run test:coverage      # couverture (objectif : 80% global, 90% logique métier)
npm run e2e                # Playwright
```

## 5. Tailwind et charte graphique

Couleurs StackNest exposées dans `src/index.css` via `@theme` :

- `bg-night` / `text-night` — `#032233`
- `bg-cyan` / `text-cyan` — `#0d9297`
- `bg-yellow` — `#fea21f`
- `bg-error` — `#c42b1c`
- `bg-success` — `#22c55e`

Fonts : `font-sans` (Inter/Roboto) pour l'UI, `font-mono` (JetBrains Mono) pour le code.

## 6. Créer une nouvelle feature (recette)

1. **Créer les dossiers** (`types/dto`, `types/models`, `types/enums`, `types/guards`, `mappers`, `services`, `hooks`, `components`, `pages`).
2. **Définir les DTO** (miroir exact de l'API).
3. **Définir les Models** (vue UI).
4. **Écrire le mapper** + son test unitaire.
5. **Écrire le service** (utilise `createApiClient` de `core/api/axios-instance`) + test avec MSW.
6. **Écrire le hook React Query** (expose des Models) + test.
7. **Écrire les composants presentationnels** (reçoivent des Models en props) + tests.
8. **Écrire la page container** + test d'intégration.
9. **Ajouter les routes** dans `core/router.tsx`.
10. **Vérifier** : `npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build` — 0 erreur.

## 7. Sentry

`initSentry` est appelé dans `main.tsx`. Il ne fait rien si `VITE_SENTRY_DSN` est vide — c'est le comportement attendu en local.

## 8. Bandeau d'environnement

`<EnvironmentBanner>` lit `VITE_ENVIRONMENT`. Affiche `DEV` (bleu night), `TEST` (rouge), `PREVIEW` (jaune). Aucun bandeau en `prod`.
