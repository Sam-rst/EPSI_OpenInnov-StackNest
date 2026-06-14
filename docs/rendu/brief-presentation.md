# Brief de présentation — Deck StackNest (pour Claude Design)

> Brief structuré pour générer le **deck de présentation orale** (jury EPSI). À transmettre à un
> agent « Design » (ou via le skill de création de slides). Le contenu vient du
> `rapport-technique.md` et du `guide-demo.md` de ce même dossier.

---

## 1. Objectif du deck

Support visuel de l'**oral jury EPSI** : poser le problème, montrer la valeur, expliquer
l'architecture et la stack, **renvoyer vers la démo live**, puis convaincre sur la qualité, la
sécurité/RGPD et la roadmap. Le deck **appuie** la parole — il ne la remplace pas.

## 2. Audience

Jury **EPSI** (enseignants / professionnels) : profils mixtes tech et non-tech. Sensibles aux choix
**justifiés**, à la **rigueur méthodo** (TDD, CI), à la **sécurité/RGPD**, et à la maturité produit.

## 3. Durée & format

- **~5 minutes**, **6 à 8 slides** (≈ 40-50 s par slide).
- Slides aérées : 1 idée par slide, **3-5 bullets courts** max, visuel fort.
- Une slide « démo » qui **renvoie** au live (pas de captures qui doublonnent la démo).

## 4. Ton

Clair, technique sans jargon inutile, **orienté action** (cohérent avec la baseline
*« Build Fast. Deploy Smart. »*). Phrases courtes, verbes d'action. **Texte en français** (le
wordmark « StackNest » et la tagline restent en anglais).

## 5. Charte graphique StackNest (à appliquer)

| Élément | Valeur |
|---|---|
| **Bleu nuit** (primaire / fond sombre / texte) | `#032233` |
| **Cyan** (accent / action) | `#0d9297` |
| **Jaune** (accent secondaire / mise en avant) | `#fea21f` |
| **Rouge** (erreur / destructif) | `#c42b1c` |
| **Vert** (succès) | `#22c55e` |
| **Police UI / titres** | **Inter** (fallback Roboto, system-ui) |
| **Police code / monospace** | **JetBrains Mono** |
| **Logos (SVG)** | `docs/brand/assets/` — `logo.svg` (couleur), `logo-mono-night.svg`, `logo-mono-cyan.svg`, `logo-mono-white.svg`, `logo-mono-yellow.svg` |

Règles : préserver le ratio du logo, choisir la variante mono qui **maximise le contraste**, zone de
protection autour du logo, pas de recolorisation hors palette. Recommandation : **fond bleu nuit**
(`#032233`) avec logo `logo-mono-white.svg` ou `logo-mono-cyan.svg`, accents **cyan** et touches de
**jaune** pour les éléments à mettre en avant.

---

## 6. Plan slide par slide

### Slide 1 — Couverture
- **StackNest** + logo + baseline *« Build Fast. Deploy Smart. »*.
- Sous-titre : *Internal Developer Platform — provisionnez en autonomie.*
- Contexte : Oral jury EPSI Open Innovation · équipe de 7 (Dev / Cyber / Design-QA).
- Fond bleu nuit, logo mono blanc/cyan, accent jaune sur la baseline.

### Slide 2 — Problème & valeur
- Obtenir une ressource = **ticket Ops** (délai, friction) ou conteneurs « à la main » (hétérogène, secrets en clair).
- **StackNest** : guichet unique self-hosted, **catalogue maîtrisé**.
- **2 portes** : UI web **+** chat IA. **2 granularités** : service unique **+** stack multi-services.
- Personas : étudiant · dev senior · lead PME.

### Slide 3 — Architecture & stack
- Schéma en blocs : `UI (Nginx)` → `API (FastAPI)` → `DB Postgres 16` / `Redis (arq + SSE)` → `Worker` → `Hôte Docker`.
- **Plan de contrôle ≠ hôte d'exécution** (isolation).
- Stack : FastAPI/Python 3.13 · React/Vite/TS · PostgreSQL 16 · Redis · Docker SDK · **LLM pluggable** (Ollama/OpenAI/Anthropic).
- **Clean Architecture + vertical slicing** (back & front).

### Slide 4 — Fonctionnalités clés (renvoi démo)
- Catalogue **45 templates** (31 déployables / 14 bloqués).
- Déploiement Docker **live + SSE** + cycle de vie complet.
- **Composeur de stack** Docker Compose (liens `{to.*}`).
- **Chat IA** : propose *deploy* **et** *compose_stack*.
- Bandeau : **« → Démonstration en direct »**.

### Slide 5 — Qualité & méthodologie
- **TDD strict** (Red → Green → Blue).
- **~1 184 tests** back (pytest) · **903** front (Vitest) · couverture 80/90 %.
- **CI multi-lanes** (lint / format / typecheck / sécurité / tests / build), gates **bloquants**.
- **Dev multi-agents en worktrees** (stacks Docker isolées) + Trunk-Based Dev + rapports d'étonnement.

### Slide 6 — Sécurité & RGPD
- **Secrets** générés worker-side, **jamais persistés**, affichés une fois.
- **Compose-file via stdin** (jamais sur disque).
- **Anti-hallucination** : boîte à outils fermée + validation déterministe + confirmation obligatoire.
- **RGPD** : données minimales, **Ollama on-premise**, droit à l'oubli, rétention bornée.

### Slide 7 — Roadmap
- v2 stacks : cycle de vie **par service**, édition, répliques.
- Vraie **pause** conteneur · provisioning **Terraform/Proxmox** (débloque les cartes infra).
- **MFA TOTP** · 2ᵉ LLM « juge ».
- Horizon : bêta-test & commercialisation (2027).

### Slide 8 — Clôture
- Récap valeur : **autonomie encadrée, sûre, self-hosted**.
- Rappel baseline *« Build Fast. Deploy Smart. »* + logo.
- « Merci — questions ? »

> Si réduction à **6 slides** : fusionner 2+3 (problème + archi) et 6+7 (sécurité + roadmap).

## 7. Recommandations visuelles

- Privilégier **schémas et icônes** plutôt que du texte dense ; un seul visuel fort par slide.
- Code / commandes en **JetBrains Mono** sur fond `--code-bg` sombre.
- Utiliser le **jaune** avec parcimonie (1-2 accents par slide max), le **cyan** pour les actions.
- Cohérence avec l'UI réelle (mêmes couleurs) pour que le deck et la démo se répondent.
