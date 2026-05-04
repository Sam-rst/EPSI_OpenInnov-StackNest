# Architecture frontend — `apps/web/`

> Référence visuelle : [`StackNest — Charte graphique.pdf`](../../StackNest%20—%20Charte%20graphique.pdf) à la racine du repo.
> Spec produit : [`docs/superpowers/specs/2026-04-14-stacknest-architecture-design.md`](../superpowers/specs/2026-04-14-stacknest-architecture-design.md).

Ce document décrit comment le frontend StackNest est organisé, les règles à suivre quand on ajoute du code, et l'ordre de port (déjà fait) prototype → production.

---

## 1. Philosophie

Trois principes non négociables :

1. **Clean Architecture + Vertical Slicing** — chaque feature métier a son propre slice complet (`domain/`, `api/`, `store/`, `hooks/`, `components/`, `pages/`). Une feature **n'importe jamais** une autre feature directement.
2. **1 fichier = 1 composant**, **≤ 150 lignes** par fichier (warning ESLint à 150). Si un composant dépasse, on extrait des sous-composants.
3. **TypeScript strict** partout — `noUncheckedIndexedAccess`, `noUnusedLocals`, `noImplicitReturns`, `@typescript-eslint/no-explicit-any: error`. Aucun `any` en code applicatif.

À cela s'ajoute :

- **Tailwind classes only** — `bg-surface`, `text-text-primary`, `border-cyan`. Zéro `style={{}}` inline sauf valeurs dynamiques (heights animées, couleurs calculées via prop).
- **CSS séparé** pour les keyframes et les classes décoratives complexes (`src/styles/animations.css`, `src/styles/backgrounds.css`).
- **Tokens centralisés** dans [`src/core/theme/tokens.css`](../../apps/web/src/core/theme/tokens.css) — source de vérité pour la charte graphique, mappés sur Tailwind.

---

## 2. Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | React 18 + Vite | Standard moderne, HMR rapide |
| Langage | TypeScript strict 5.6 | Type safety production-grade |
| Routing | react-router-dom 6 (lazy) | Code splitting par route gratuit |
| Server state | TanStack Query 5 (préinstallé) | Cache, retry, invalidation — branche quand backend prêt |
| Forms | React Hook Form + Zod (préinstallés) | Validation typée |
| Styling | Tailwind 3 + CSS vars | Tokens centralisés, dark mode `class` |
| Animation | Framer Motion 11 | Animations déclaratives, layout animations |
| Icônes | lucide-react | Tree-shakable, kebab-case via wrapper `<Icon>` |
| Lint | ESLint 9 + Prettier | `max-lines: 150`, `max-lines-per-function: 80` |

---

## 3. Structure de dossiers

```
apps/web/
├── index.html
├── package.json
├── tsconfig.json · tsconfig.node.json
├── vite.config.ts · tailwind.config.ts · postcss.config.js
├── .eslintrc.cjs · .prettierrc
├── public/assets/                  # logos SVG (favicon + variantes mono)
└── src/
    ├── main.tsx                    # ReactDOM root + StrictMode
    ├── App.tsx                     # ThemeProvider + BrowserRouter + AppRouter
    ├── vite-env.d.ts
    ├── styles/
    │   ├── globals.css             # @tailwind + import tokens + scrollbar + a11y
    │   ├── backgrounds.css         # .stars · .grid-bg · .mockup-perspective …
    │   └── animations.css          # @keyframes blink/marquee · .typing-caret
    │
    ├── core/                       # ✦ shared kernel — tout transverse vit ici
    │   ├── theme/
    │   │   ├── tokens.css          # source de vérité (light + dark)
    │   │   ├── Theme.ts            # type Theme, readInitialTheme()
    │   │   ├── ThemeContext.ts     # createContext seul (split pour fast refresh)
    │   │   ├── ThemeProvider.tsx
    │   │   └── useTheme.ts
    │   ├── routing/
    │   │   ├── routes.ts           # ROUTES const — source de vérité des paths
    │   │   └── AppRouter.tsx       # routes lazy-loaded par feature
    │   ├── ui/                     # primitives sans logique métier
    │   │   ├── cn.ts · Icon.tsx · LogoMark.tsx · LogoLockup.tsx
    │   │   ├── Button.tsx · Card.tsx · Badge.tsx · StatusDot.tsx
    │   │   ├── Avatar.tsx · CountUp.tsx
    │   │   └── index.ts            # barrel (curated)
    │   ├── layout/AppShell/        # layout app (sidebar + topbar persistants)
    │   │   ├── AppShell.tsx        # ≤ 30 lignes : Sidebar + Topbar + Outlet animé
    │   │   ├── Sidebar.tsx · SidebarHeader · SidebarNav · SidebarNavItem · SidebarCostCard · WorkspaceSwitcher
    │   │   ├── Topbar.tsx · TopbarSearch · TopbarActions · TopbarUser
    │   │   ├── nav.ts              # SIDEBAR_NAV + TOPBAR_TITLES
    │   │   └── index.ts
    │   └── data/
    │       └── team.ts             # TEAM_MEMBERS (mock — Yassine Owner·Admin)
    │
    ├── marketing/                  # ✦ landing publique (non authentifiée)
    │   ├── components/
    │   │   ├── hero/               # Hero · HeroNav · HeroBadge · HeroContent · HeroCtas · HeroTrustline · HeroMockup
    │   │   │   └── catalogMockup/  # MockupChrome · MockupSidebar · MockupHeader · MockupBody · MockupResourceCard · CatalogMockup + .data.ts
    │   │   ├── personas/           # carousel auto-avançant + 3 mockups custom
    │   │   ├── howItWorks/         # 3 étapes avec connecteur SVG animé
    │   │   ├── features/           # bento 2×2 + 4 inner mockups
    │   │   ├── stackMarquee/       # 2 marquees infinies (CSS séparé)
    │   │   ├── finalCta/
    │   │   └── footer/
    │   ├── hooks/useSmoothAnchorScroll.ts
    │   └── pages/LandingPage.tsx
    │
    ├── auth/                       # ✦ login (pas d'API encore, mock direct)
    │   ├── components/             # OAuthButtons · Divider · LoginForm · LoginVisual
    │   └── pages/LoginPage.tsx
    │
    ├── catalog/                    # ✦ Service Catalog (Store)
    │   ├── domain/models/CatalogItem.ts
    │   ├── data/catalog.fixtures.ts
    │   ├── hooks/useCatalogFilters.ts
    │   ├── components/
    │   │   ├── filters/ (SearchFilter · FilterList · ChatOpsHint · CatalogFilters)
    │   │   ├── CatalogCard · CatalogGrid · CatalogEmpty · CatalogHeader
    │   └── pages/CatalogPage.tsx
    │
    ├── deployment/                 # ✦ Configuration + suivi déploiement
    │   ├── data/sizes.ts · deploymentLogs.ts
    │   ├── hooks/useConfigState · useFlashLines · useStreamingLogs · useStepProgress
    │   ├── components/
    │   │   ├── forms/ (Field · Select · Toggle)
    │   │   ├── config/ (ConfigHeader · IdentityCard · CapacityCard · SizePicker · StorageSlider · OptionsCard · TerraformPreview · TerraformLine · CostEstimate)
    │   │   └── deploy/ (DeployHeader · Stepper · StepperCircle · StreamedLogs* · DeployDetailsCard · DeployCredentialsCard)
    │   └── pages/ConfigPage.tsx · DeploymentPage.tsx
    │
    ├── dashboard/                  # ✦ KPI · graph coûts · activité · table ressources
    │   ├── data/dashboard.fixtures.ts
    │   ├── components/
    │   │   ├── KpiCard · KpiGrid · ActivityFeed · DashboardHeader
    │   │   ├── costsChart/ (CostsChart · CostsChartHeader · CostsChartSvg)
    │   │   └── activeTable/ (ActiveResourcesTable · ActiveTableHeader · ActiveTableRow · envBadgeTone)
    │   └── pages/DashboardPage.tsx
    │
    ├── chat/                       # ✦ ChatOps IA (typing animation, plan card)
    │   ├── domain/models/Message.ts
    │   ├── data/chat.fixtures.ts
    │   ├── hooks/useChat.ts
    │   ├── components/
    │   │   ├── sidebar/ (ConversationsSidebar · ConversationItem)
    │   │   ├── messages/ (MessageList · MessageBubble · TypingBubble · PlanBubble · PlanItemRow · AssistantBubbleIcon · Suggestions)
    │   │   ├── composer/ChatComposer
    │   │   └── TerraformAside
    │   └── pages/ChatPage.tsx
    │
    ├── admin/                      # ✦ RBAC : équipe + matrice permissions
    │   ├── domain/enums/UserRole.ts (RoleFilter, ROLE_TONES)
    │   ├── data/permissions.ts
    │   ├── components/ (AdminHeader · RoleFilters · TeamTable · TeamTableRow · PermissionMatrix)
    │   └── pages/AdminPage.tsx
    │
    └── settings/                   # ✦ Profil · Sécurité · Intégrations · Facturation · Clés API
        ├── domain/tabs.ts (SettingsTabId, SETTINGS_TABS)
        ├── data/integrations.ts · sessions.ts · apiKeys.ts
        ├── components/
        │   ├── forms/ (SField · SInput · SettingRow · StatTile)
        │   ├── tabs/ (ProfileTab · SecurityTab · SessionRow · IntegrationsTab · IntegrationCard · BillingTab · ApiKeysTab · ApiKeyRow)
        │   ├── SettingsSidebar · SettingsContent
        └── pages/SettingsPage.tsx
```

**~95 fichiers `.ts`/`.tsx`/`.css`**, tous ≤ 150 lignes.

---

## 4. Sens des dépendances (règle d'or)

```
pages → components → hooks → store → api → domain
                                ↑__________________|
core/  (transverse)  —  importable par tout le monde, n'importe jamais une feature
```

Concrètement :

- **`core/`** ne dépend de **rien** d'applicatif. Il peut être importé par toutes les features.
- Une feature **n'importe jamais** une autre feature. Si `dashboard/` a besoin du nom d'un membre, il passe par `@core/data/team.ts`.
- **`domain/`** d'une feature ne dépend de rien (pas de React, pas d'I/O).
- **`api/`** peut dépendre de `domain/` (pour le mapping DTO → Model).
- **Les pages** sont les seules à composer plusieurs hooks/components.

Si tu hésites à mettre quelque chose dans `core/` ou dans une feature : si **deux features** s'en servent → `core/`. Sinon → la feature.

---

## 5. Conventions de nommage

| Type | Convention | Exemple |
|---|---|---|
| Composant | PascalCase, fichier = composant exporté | `ResourceCard.tsx` |
| Compound | dossier + `index.ts` qui ré-exporte | `AppShell/index.ts` |
| Hook | camelCase, préfixe `use` | `useCatalogFilters.ts` |
| Data fixture | suffixe `.fixtures.ts`, dans `data/` | `catalog.fixtures.ts` |
| Domain model | PascalCase, dans `domain/models/` | `CatalogItem.ts` |
| Domain enum | PascalCase, dans `domain/enums/` | `UserRole.ts` |
| Page | suffixe `Page` | `DashboardPage.tsx` |
| Tests | colocalisés `.unit.test.ts` / `.integ.test.ts` | (à venir quand le backend connecté) |

---

## 6. Theme & styling

- **Tokens** dans [`src/core/theme/tokens.css`](../../apps/web/src/core/theme/tokens.css) — un set complet pour `:root` (clair) et `html.dark` (sombre).
- **Tailwind** mappe ces tokens en classes via [`tailwind.config.ts`](../../apps/web/tailwind.config.ts) :
  - `bg-surface`, `bg-surface-elevated`, `bg-surface-sunken`
  - `text-text-primary`, `text-text-secondary`, `text-text-muted`
  - `border-border`, `border-cyan`
  - `bg-cyan`, `bg-sun`, `bg-night`, `bg-success`, `bg-danger`
- **`<ThemeProvider>`** dans `App.tsx` ajoute/retire la classe `dark` sur `<html>`. Toggle via `useTheme()` (header de l'app + footer de la landing).
- **Persistance** : `localStorage.stacknest-theme`. Initialisation depuis `prefers-color-scheme` si rien n'est stocké.

**Règle stylistique** : si la valeur peut être exprimée en classe Tailwind, c'est une classe Tailwind. `style={{}}` est réservé aux valeurs **calculées** (couleur d'avatar derived from prop, hauteur animée Framer, etc.).

---

## 7. Routing

[`src/core/routing/routes.ts`](../../apps/web/src/core/routing/routes.ts) est la **source de vérité** des paths. Toujours utiliser `ROUTES.app.catalog` au lieu d'un literal `/app/catalog`.

```ts
ROUTES.public.{landing, login}
ROUTES.app.{catalog, config, deploy, deployment(runId), dashboard, chat, admin, settings}
```

Toutes les routes sont **lazy-loaded** dans [`AppRouter.tsx`](../../apps/web/src/core/routing/AppRouter.tsx) — code splitting automatique par feature.

Les routes app sont sous `<AppShell />` (sidebar + topbar persistants). Les routes publiques (landing, login) n'ont pas de shell.

---

## 8. Animation strategy

- **Framer Motion** est utilisé pour : entrée de page (`AnimatePresence` dans `AppShell`), reveal au scroll (`whileInView`), carrousel personas (auto-advance + transitions wait), bar chart (count-up + height anim), typing bubbles, layout animations sur la grille catalog (filtres → réordonnancement fluide).
- **CSS keyframes** dans `animations.css` pour : `typing-blink`, `marquee-left`, `marquee-right`. Le marquee a **deux pistes** dupliquées avec `mask-image: linear-gradient` pour un fade aux bords.
- **`prefers-reduced-motion`** respecté globalement dans `globals.css`.

---

## 9. Comment ajouter quelque chose

### Une nouvelle page dans une feature existante

1. `src/{feature}/pages/MyPage.tsx` — composant principal, ≤ 80 lignes, juste de la composition
2. Ajouter la route dans `core/routing/routes.ts`
3. Ajouter la lazy import dans `core/routing/AppRouter.tsx`
4. Si nav app : ajouter dans `core/layout/AppShell/nav.ts`

### Un nouveau composant dans une feature

- Mets-le dans `src/{feature}/components/`. S'il a des sous-composants, crée un sous-dossier `{feature}/components/myThing/MyThing.tsx + sub-files`.
- Si le composant dépasse 150 lignes : extrais des sous-composants. Si la logique d'état dépasse 30 lignes : extrais un hook dans `{feature}/hooks/`.

### Une nouvelle feature complète

```
src/myFeature/
├── domain/
│   ├── models/MyEntity.ts
│   ├── enums/MyStatus.ts
│   └── guards/canDoX.ts
├── api/
│   ├── dto/MyEntityResponseDto.ts          # snake_case miroir API
│   ├── mappers/MyEntityMapper.ts           # toMyEntity(dto): MyEntity
│   └── MyFeatureApi.ts
├── data/                                    # fixtures pour démo / MSW
├── store/                                   # si state global → Context API
├── hooks/useMyFeature.ts                    # TanStack Query queries/mutations
├── components/
│   ├── filters/                             # split par responsabilité
│   ├── MyCard.tsx
│   └── MyHeader.tsx
└── pages/MyFeaturePage.tsx
```

Puis ajouter l'alias dans `vite.config.ts` et `tsconfig.json` (`@myFeature/*`).

### Une primitive UI partagée

- Dans `src/core/ui/`. Un fichier par composant. Re-exporter dans `src/core/ui/index.ts`.
- Garde les primitives **sans logique métier** : `Button`, `Card`, `Badge`, `Avatar`, `Icon`, `LogoMark`, etc.

---

## 10. DTO / Model / Mapper (quand le backend sera connecté)

Pattern pour chaque entité qui vient du backend :

```ts
// {feature}/api/dto/MyEntityResponseDto.ts
export interface MyEntityResponseDto {
  id: string;
  display_name: string;            // snake_case miroir API FastAPI
  monthly_cost_eur: number;
  created_at: string;              // ISO string
}

// {feature}/domain/models/MyEntity.ts
export interface MyEntity {
  id: string;
  displayName: string;             // camelCase pour l'UI
  monthlyCost: number;
  createdAt: Date;                 // Date, pas string
}

// {feature}/api/mappers/MyEntityMapper.ts
export const toMyEntity = (dto: MyEntityResponseDto): MyEntity => ({
  id: dto.id,
  displayName: dto.display_name,
  monthlyCost: dto.monthly_cost_eur,
  createdAt: new Date(dto.created_at),
});
```

Le **mapper est pur** (pas d'I/O, pas d'effets, testable au niveau unit). Le hook l'appelle :

```ts
export const useMyEntities = () => useQuery({
  queryKey: ['my-entities'],
  queryFn: async () => {
    const dtos = await MyFeatureApi.list();
    return dtos.map(toMyEntity);   // les composants reçoivent du Model
  },
});
```

Aujourd'hui, comme il n'y a pas encore de backend, on utilise des `data/*.fixtures.ts` directement importés. Quand le backend FastAPI sera prêt, on passe en MSW + AuthApi/CatalogApi/etc., et chaque composant ne change pas (ils consomment toujours du Model).

---

## 11. Commandes

```bash
cd apps/web

npm install
npm run dev              # http://localhost:5173
npm run typecheck        # tsc --noEmit (strict, doit passer à 0 erreur)
npm run lint             # ESLint, 0 warning toléré (max-lines: 150)
npm run build            # tsc -b + vite build → dist/
npm run preview          # serve dist/

# (futur — quand le backend connecté)
npm run test             # vitest (unit + integ avec MSW)
npm run test:e2e         # Playwright
```

---

## 12. État actuel

- ✅ **9 features** scaffoldées et complètes : `core`, `marketing`, `auth`, `catalog`, `deployment`, `dashboard`, `chat`, `admin`, `settings`
- ✅ **Landing premium** : hero + perspective 3D + carousel personas + how it works + features bento + stack marquee + CTA + footer
- ✅ **App complète** : login → catalog → config (Terraform live) → deploy (stepper + logs streamés) → dashboard (KPI + bar chart) → ChatOps (typing) → admin (RBAC + matrice) → settings (5 onglets)
- ✅ Theme dark/light avec tokens, persistance localStorage
- ✅ Toutes routes lazy-loaded
- ⏳ **Backend pas encore connecté** — toutes les pages consomment des fixtures dans `{feature}/data/*.fixtures.ts`. Quand `apps/api/` sortira, on remplace par TanStack Query + MSW pour les tests.
- ⏳ **Tests** à brancher quand le backend permet d'avoir des contrats API stables (DTO/Model figés).

---

## 13. Pourquoi ces choix vs alternatives

| Décision | Alternative refusée | Raison |
|---|---|---|
| TS strict | JSX nu | Production-grade non négociable en 2026, type safety obligatoire pour une équipe |
| 1 fichier = 1 composant | Gros fichiers monolithiques | Lisibilité, diff PR clair, refactor sûr |
| ≤ 150 lignes / fichier | Pas de limite | Force à extraire, pousse au compound, clean reviews |
| Tailwind classes only | CSS-in-JS / inline styles | Tokens centralisés, dark mode trivial, performance build |
| Vertical slicing | Layered (par type : tous les models ensemble, tous les components ensemble) | Cohésion par feature, suppression d'une feature = `rm -rf {feature}/` |
| Lazy loading par route | Bundle unique | Time-to-interactive divisé, code splitting automatique |
| `localStorage` pour theme/auth (provisoire) | Cookie httpOnly | Backend pas encore là — quand l'API sera connectée, token JWT en cookie httpOnly |
| Fixtures inline (provisoire) | MSW dès maintenant | Coût > bénéfice tant que le backend n'est pas figé |

---

## 14. Pendant que tu développes

- **`@core/ui` est un barrel curé** — n'y mets que des primitives sans logique métier. Pour le reste, import direct (`import { Hero } from '../components/hero/Hero'`).
- **Évite les ré-imports croisés entre features.** Si tu sens un besoin → c'est probablement un signal pour remonter le type/composant dans `core/`.
- **Tailwind a des tokens custom** mappés sur les CSS vars : préfère `bg-surface-elevated` à `bg-white`, `text-text-muted` à `text-gray-500`. C'est le seul moyen pour que le dark mode soit gratuit.
- **ESLint warning sur `max-lines`** = signal d'extraction. Pas un nice-to-have.
