# Socle design system runtime (`apps/web`) — STN-159

> **Ticket** : [STN-159](https://samrst-studies.atlassian.net/browse/STN-159) — `[Core] Socle design system runtime (tokens, dark mode, fonts, Logo)`
> **Branche** : `feature/STN-159-socle-design-system` · **Epic** : STN-16 [Core] UI Shell & Layout
> **Nature** : « vague 0 » solo (worktree), display-only, **TDD strict** Red→Green→Blue.

## 1. But

Poser dans `apps/web` (React 19 / RR7 / Tailwind 4 CSS-first / Vite 8) la **fondation visuelle**
réutilisée par toutes les futures features, en s'appuyant sur la charte vivante
`docs/brand/README.md` et la référence `apps/web-mockup`. **Aucune primitive UI spéculative**
(Button, Card, Badge… seront tirées juste-à-temps par les tickets feature — anti-YAGNI).

## 2. Périmètre

| Inclus | Hors périmètre |
| --- | --- |
| Tokens sémantiques light/dark (`index.css`) | Primitives UI génériques (Button/Card/Badge/Input/Avatar/StatusDot) |
| Dark mode (`html.dark` + ThemeProvider/useTheme, persistance + `prefers-color-scheme`) | Pages feature (catalogue, auth, deployment) |
| Fonts Inter + JetBrains Mono **self-host** (`@fontsource`) | Tout backend |
| Util `cn` (clsx + tailwind-merge) | |
| Composant `Logo` (LogoMark + LogoLockup, variantes mono) | |
| favicon StackNest + métadonnées `index.html` | |

## 3. Décisions techniques

### 3.1 Tokens sémantiques — Tailwind v4 `@theme inline`
- Variables brutes de la charte (`--surface`, `--text-primary`, …) déclarées dans `:root`
  (clair par défaut) et surchargées dans `.dark` (sombre).
- Mappées vers des utilitaires Tailwind via **`@theme inline`** (`--color-surface: var(--surface)`)
  pour que les classes (`bg-surface`, `text-text-primary`, `border-border`…) **réagissent à la
  bascule `.dark` au runtime** (l'utilitaire référence la var brute, surchargée par `.dark`).
- `@custom-variant dark (&:where(.dark, .dark *))` pour activer la stratégie **classe** (et non
  `prefers-color-scheme` par défaut de Tailwind v4) sur les variantes `dark:` explicites.
- `body` applique `background-color: var(--surface)` + `color: var(--text-primary)` → toute la page
  bascule automatiquement.
- 11 tokens × 2 thèmes (charte §3) + nuances cyan 500/600/700 + couleurs de marque (STN-10).

### 3.2 Dark mode — `core/theme/` (shell du projet, pas une feature)
- `Theme.ts` : type `Theme`, `THEME_STORAGE_KEY`, `readInitialTheme()` (localStorage > `prefers-color-scheme` > `light`).
- `ThemeContext.ts` : contexte typé (`theme`, `setTheme`, `toggleTheme`).
- `ThemeProvider.tsx` : applique `documentElement.classList.toggle('dark')` + persiste dans `localStorage`.
- `useTheme.ts` : hook, throw hors provider.
- Fichiers séparés (1 export significatif/fichier) pour satisfaire `react-refresh/only-export-components`.

### 3.3 Fonts — self-host `@fontsource` (offline-friendly démo jury)
- Packages **statiques** `@fontsource/inter` (400/500/600/700) + `@fontsource/jetbrains-mono`
  (400/500/700) : ils enregistrent les familles `'Inter'` / `'JetBrains Mono'` qui **matchent
  exactement** les tokens `--font-sans` / `--font-mono` (les variantes *Variable* renommeraient en
  `'Inter Variable'` → écartées).
- Imports dans `main.tsx`. Suppression du `<link>` Google Fonts de `index.html` (zéro dépendance CDN runtime).

### 3.4 `cn` — `shared/lib/cn.ts`
- `cn(...inputs) = twMerge(clsx(inputs))` : compose conditionnellement **et** dédoublonne les classes
  Tailwind conflictuelles (`px-2 px-4` → `px-4`). Réutilisé par tous les composants.

### 3.5 `Logo` — `shared/components/Logo/` (réutilisé par ≥2 zones : shell, auth…)
- `logoSources.ts` : type `LogoVariant` (`color | mono-night | mono-cyan | mono-white | mono-yellow`),
  map variante → `/assets/<fichier>.svg`, ratio source **97 × 127**.
- `LogoMark.tsx` : `<img>` servant le SVG `public/assets/`, `size` → width, height = `round(size·127/97)`
  (ratio préservé), `alt` (défaut « StackNest »), `className`.
- `LogoLockup.tsx` : `LogoMark` **décoratif** (`alt=""`) + wordmark « StackNest » (nom accessible porté
  par le texte visible, pas de double annonce lecteur d'écran).
- Réécrit en TDD — **non porté** du mockup React 18 (qui inline le SVG couleur uniquement).

### 3.6 Visibilité (le dark mode + la marque doivent être VISIBLES)
- `shared/components/ThemeToggle.tsx` : bouton accessible (consomme `useTheme`) — pas une primitive
  générique, c'est le contrôle intrinsèque du CA dark mode.
- Câblage minimal dans le stub `core/layout/TopBar.tsx` (Logo + ThemeToggle) et `ThemeProvider` autour
  de l'app dans `App.tsx`. Le stub sera reconstruit par STN-23.

## 4. Stratégie de test (TDD strict)

| Unité | Niveau | Nature du test |
| --- | --- | --- |
| `cn` | unit | fonction pure (merge, dédoublonnage, conditionnel) |
| `Theme`/`ThemeProvider`/`useTheme` | unit | comportement (localStorage, `matchMedia` mocké, classe `.dark`, throw hors provider) |
| `ThemeToggle` | unit | rendu + bascule via `useTheme` (Testing Library) |
| `Logo` (Mark/Lockup) | unit | rendu, `src` par variante, ratio, wordmark, `className` |
| Tokens `index.css` | integ | **contract test** (`?raw`) : 11 tokens présents en `:root` ET `.dark` |
| `index.html` meta | integ | **contract test** (`?raw`) : title/description/theme-color/og:image, lang fr, **absence** de `fonts.googleapis.com` |

Les tokens CSS et les méta `index.html` sont déclaratifs (config) : on garde un *contract test* de
non-régression du contrat + validation visuelle via la preview (port 5273).

## 5. Validation (DoD)
`npm run test` (vert) → `npm run lint` (`--max-warnings 0`) → `npm run typecheck` → `npm run format:check`
→ `npm run build` → preview visuelle light/dark → commit FR (`STN-159`), PR, CI verte.

## 6. Risques
- **Tailwind v4 + dark par classe** : sans `@custom-variant`, `dark:` reste en `prefers-color-scheme`
  → mitigé par la déclaration explicite + le swap de vars sous `.dark`.
- **`@fontsource` Variable** renommerait la famille → on fige les packages **statiques**.
- **FOUC / flash de thème** : `readInitialTheme` lit `localStorage`/`prefers-color-scheme` au 1er rendu ;
  flash résiduel acceptable au stade socle (un script inline pré-hydratation pourra être ajouté plus tard).
