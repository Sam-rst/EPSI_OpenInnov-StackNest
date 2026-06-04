# Charte graphique & identité de marque — StackNest

> **Source de vérité documentaire de la marque StackNest.**
> Ce dossier transcrit la charte graphique sous forme **vivante** (markdown + SVG), exploitable
> directement par les développeurs et les agents IA, sans avoir à ouvrir le PDF.
>
> - 📄 **Référence d'origine** : [`charte-graphique.pdf`](./charte-graphique.pdf) (document figé, design d'origine).
> - 🎨 **Logos source (SVG)** : [`assets/`](./assets/).
> - ⚙️ **Intégration runtime** (tokens Tailwind/CSS, favicon, composant `Logo`) dans `apps/web` :
>   traitée dans un ticket dédié (voir « Couche B » plus bas). Ce dossier reste **documentaire**.

---

## 1. Marque

- **Nom** : StackNest
- **Baseline / tagline** : *Build Fast. Deploy Smart.*
- **Positionnement** : Internal Developer Platform (IDP) — provisionnement autonome de ressources
  IT (VMs, bases, environnements) via UI web ou chatbot IA.

---

## 2. Logo

Le logo combine une **marque** (symbole, « nid » de couches empilées surmonté d'un élément jaune)
et, en lockup, le **wordmark** « StackNest ».

| Fichier | Usage |
| --- | --- |
| [`assets/logo.svg`](./assets/logo.svg) | Logo couleur principal (symbole) — usage par défaut sur fond clair ou neutre |
| [`assets/logo-mono-night.svg`](./assets/logo-mono-night.svg) | Aplat bleu nuit — fonds clairs, impression mono |
| [`assets/logo-mono-cyan.svg`](./assets/logo-mono-cyan.svg) | Aplat cyan — fonds sombres ou accent |
| [`assets/logo-mono-white.svg`](./assets/logo-mono-white.svg) | Aplat blanc — fonds sombres / photos |
| [`assets/logo-mono-yellow.svg`](./assets/logo-mono-yellow.svg) | Aplat jaune — usages d'accent contrôlés |

**Composants de référence (mockup)** : `apps/web-mockup/src/core/ui/LogoMark.tsx` (symbole seul) et
`LogoLockup.tsx` (symbole + wordmark). À redévelopper proprement en TDD dans `apps/web` (couche B).

**Règles d'usage**
- ✅ Préserver le ratio d'origine (symbole ≈ 97 × 127) ; ne jamais déformer ni étirer.
- ✅ Choisir la variante mono qui **maximise le contraste** avec le fond.
- ✅ Conserver une **zone de protection** ≈ hauteur de la boucle supérieure autour du logo.
- ❌ Ne pas recolorer hors palette, ne pas ajouter d'ombre/contour, ne pas poser le logo couleur
  sur un fond qui casse la lisibilité (préférer alors une variante mono).

---

## 3. Palette

### Couleurs de marque

| Token | Hex | Rôle |
| --- | --- | --- |
| `brand-night` | `#032233` | Bleu nuit — couleur primaire, texte principal (light), fond (dark) |
| `brand-cyan` | `#0d9297` | Cyan — couleur d'accent / action principale |
| `brand-yellow` (sun) | `#fea21f` | Jaune — accent secondaire, mise en avant |
| `brand-error` (danger) | `#c42b1c` | Rouge — erreurs / destructif |
| `brand-success` | `#22c55e` | Vert — succès / validation |

Nuances cyan : `cyan-500 #15979D`, `cyan-600 #0d9297` (défaut), `cyan-700 #017B86`.

### Tokens sémantiques (thème clair / sombre)

Source : `apps/web-mockup/src/core/theme/tokens.css`. Le thème bascule via la classe `html.dark`.

| Token | Clair | Sombre | Rôle |
| --- | --- | --- | --- |
| `--surface` | `#f7f5f0` | `#032233` | Fond de page |
| `--surface-elevated` | `#ffffff` | `#073047` | Cartes / surfaces surélevées |
| `--surface-sunken` | `#ebe7dc` | `#021824` | Zones en creux |
| `--border` | `#d9d4c5` | `#0d3e57` | Bordures standard |
| `--border-strong` | `#b9b29d` | `#15979d` | Bordures appuyées |
| `--text-primary` | `#032233` | `#fffefa` | Texte principal |
| `--text-secondary` | `#4a5e6e` | `#c7d4dd` | Texte secondaire |
| `--text-muted` | `#7d8a96` | `#94aabb` | Texte atténué |
| `--text-inverse` | `#fffefa` | `#021824` | Texte sur fond inversé |
| `--code-bg` | `#f1ede1` | `#021824` | Fond des blocs de code |
| `--hairline` | `#e8e2d2` | `#0a334a` | Séparateurs fins |

---

## 4. Typographie

| Usage | Police | Fallback |
| --- | --- | --- |
| Interface (UI, titres, corps) | **Inter** | Roboto, `ui-sans-serif`, `system-ui`, `sans-serif` |
| Code / monospace | **JetBrains Mono** | `ui-monospace`, `monospace` |

Lissage : `-webkit-font-smoothing: antialiased`, `text-rendering: optimizeLegibility`.

---

## 5. Ton de voix

- **Clair, technique, sans jargon inutile.** On s'adresse à des équipes techniques.
- **Orienté action** (« Build Fast. Deploy Smart. ») : verbes d'action, phrases courtes.
- **UI 100 % en français** (règle projet) ; le wordmark et la tagline restent en anglais.

---

## 6. Couche B — intégration runtime (hors ce dossier)

L'application de production `apps/web` ne consomme **pas** ce dossier directement. L'intégration
vivante de l'identité (source unique de vérité côté runtime) fait l'objet d'un **ticket dédié** :

- Porter la palette + les fonts dans le **thème Tailwind d'`apps/web`** (tokens) + variables CSS.
- Servir les **logos + favicon** réels dans `apps/web/public/assets/`.
- Renseigner les **métadonnées** `index.html` (title, description/tagline, `theme-color`, og:image).
- Recréer un composant **`Logo`** en **TDD strict** (inspiré de `LogoMark`/`LogoLockup` du mockup).

Tant que ce ticket n'est pas livré, ce dossier `docs/brand/` est la référence faisant autorité.
