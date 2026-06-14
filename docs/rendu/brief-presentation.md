# Brief de présentation — Deck StackNest (pour Claude Design)

> Brief structuré pour générer le **deck de présentation orale** (jury EPSI). À transmettre à un
> agent « Design » (ou via le skill de création de slides). Le contenu vient du
> `rapport-technique.md` et du `guide-demo.md` de ce même dossier.

---

## 1. Objectif du deck

Support visuel de l'**oral jury EPSI**, structuré sur le **plan de présentation imposé** (1 → 6) :
poser la **problématique & le besoin** (marché + concurrents + différenciateurs), **présenter
l'appli** (accompagnement, simplicité, déploiement rapide), exposer la **stratégie d'insertion**
(bottom-up étudiant → entreprise), justifier le **pricing freemium**, **renvoyer vers la démo live**,
puis traiter les **questions/réponses** (notamment la gestion des données client en cloud). Le deck
**appuie** la parole — il ne la remplace pas. Le volet business est détaillé dans
`docs/rendu/business-strategie.md`.

## 2. Audience

Jury **EPSI** (enseignants / professionnels) : profils mixtes tech et non-tech. Sensibles aux choix
**justifiés**, à la **rigueur méthodo** (TDD, CI), à la **sécurité/RGPD**, et à la maturité produit.

## 3. Durée & format

- **~5 minutes** de présentation (les 6 blocs du plan), **6 à 9 slides** (≈ 35-50 s par slide), puis
  bascule vers la **démo live** (bloc 5) et les **Q&R** (bloc 6).
- Slides aérées : 1 idée par slide, **3-5 bullets courts** max, visuel fort.
- Une slide « démo » qui **renvoie** au live (pas de captures qui doublonnent la démo).
- Le deck suit **exactement** le plan imposé 1 → 6 (cf. section 6 ci-dessous).

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

## 6. Plan slide par slide — calé sur le plan imposé (1 → 6)

> Colonne vertébrale : **(1) Problématique & besoin → (2) Présentation de l'appli → (3) Stratégie
> d'insertion → (4) Pricing → (5) Démo → (6) Q&R**. Chaque bloc = 1 à 2 slides. Le détail business
> est dans `docs/rendu/business-strategie.md` ; le détail démo dans `docs/rendu/guide-demo.md`.

### Slide 0 — Couverture (hors plan, ouverture)
- **StackNest** + logo + baseline *« Build Fast. Deploy Smart. »*.
- Sous-titre : *Internal Developer Platform — provisionnez en autonomie.*
- Contexte : Oral jury EPSI Open Innovation · équipe de 7 (Dev / Cyber / Design-QA).
- Fond bleu nuit, logo mono blanc/cyan, accent jaune sur la baseline.

---

### Bloc 1 — Problématique & besoin

#### Slide 1a — Le besoin (cas entreprise + cas étudiant)
- **Entreprise** : obtenir une ressource = **ticket Ops** (délai, friction) ou conteneurs « à la main » (hétérogène, secrets en clair).
- **Étudiant** : une BDD + un runtime pour un **TP**, en minutes, **budget 0 €**, **zéro compétence infra**.
- Fil rouge commun : **autonomie encadrée**.

#### Slide 1b — Marché, concurrents & différenciateurs
- **3 familles** : PaaS hébergés (Railway, Render, Fly.io, Heroku, Koyeb) · IDP (Qovery, Northflank, Porter, Humanitec, Platform.sh) · self-hosted open-core (Coolify, Dokploy).
- Tendance : **free tiers en érosion** (Heroku supprimé, Fly.io sans free).
- **Ce que StackNest fait de mieux** : **chat IA qui agit** + **composeur de stack** + **catalogue maîtrisé** + **self-hostable/souverain** + **freemium étudiant 0 €**.
- Visuel : mini-tableau comparatif (3-4 concurrents, positionnement + 1er prix sourcé).

---

### Bloc 2 — Présentation de l'application

#### Slide 2 — Ce qu'on propose (accompagnement · simplicité · déploiement rapide)
- **2 portes** (UI + chat IA) · **2 granularités** (service + stack) · catalogue **45 templates**.
- **Accompagnement** : chat IA guidé, catalogue cadré (LTS/EOL, gates), defaults intelligents.
- **Simplicité** : zéro commande infra, états clairs, UI 100 % FR.
- **Déploiement rapide** : provisioning réel en minutes (Docker SDK + SSE), stack en un clic.
- *(Option : 1 slide archi condensée — `UI → API → DB/Redis → Worker → Hôte Docker`, plan de contrôle ≠ exécution.)*

---

### Bloc 3 — Stratégie d'insertion (bottom-up)

#### Slide 3 — De l'étudiant à l'entreprise (land-and-expand)
- **Habituer les étudiants** (TP gratuits) → ils deviennent **ambassadeurs** → **embauchés**, ils **réintroduisent** StackNest en entreprise → l'entreprise **paie**.
- Modèle prouvé : Docker, GitHub, Notion, Figma.
- Leviers : free tier généreux **non-prod**, **self-hostable**, ancrage **académique EPSI**, **open-core**.
- Visuel : flèche étudiant → ambassadeur → entreprise.

---

### Bloc 4 — Pricing freemium

#### Slide 4 — Grille freemium + benchmark
- Principe : **assez gratuit pour un TP, pas assez pour qu'une entreprise y échappe**.
- **Free 0 €** (TP, non-prod) · **Pro ~9 €/u** · **Team ~25 €/u** (SSO/RBAC) · **Entreprise sur devis** (SLA, données dédiées) · **Self-hosted gratuit** (open-core).
- Justifié par le marché : Railway $20/siège, Qovery $29/user, Render $7-25/service, Coolify/Dokploy gratuits en self-host. *(Tarifs consultés le 14 juin 2026.)*
- Visuel : 4-5 colonnes de plans + accent sur Free et Entreprise.

---

### Bloc 5 — Démo

#### Slide 5 — Renvoi à la démo live
- Bandeau : **« → Démonstration en direct »**.
- Fil : catalogue & gates → déploiement live → **chat IA (deploy + compose_stack)** → composeur de stack → actions en masse & dashboard.
- Phrase : *« ce qu'un étudiant fait gratuitement, une entreprise le fait à l'échelle, payant. »*

---

### Bloc 6 — Questions / réponses

#### Slide 6 — Q&R préparées (données cloud en tête)
- **Gestion des données client en cloud** : localisation **UE**, chiffrement **at-rest/in-transit**, **RGPD/DPA**, **réversibilité/export**, **isolation multi-tenant** (single-tenant Entreprise).
- **Anti-hallucination** : boîte à outils fermée + validation déterministe + confirmation.
- **Secrets** jamais persistés, **compose-file via stdin**.
- Autres : pricing vs concurrents, personas, coût LLM (Ollama 0 €), cartes Terraform bloquées.

---

### Slide 7 — Clôture
- Récap valeur : **autonomie encadrée, sûre, self-hosted, freemium**.
- Rappel baseline *« Build Fast. Deploy Smart. »* + logo.
- « Merci — questions ? »

> Si réduction à **6 slides** : fusionner 1a+1b (problématique en 1 slide) et garder 1 slide par bloc.
> Les contenus **qualité/méthodo, sécurité détaillée et roadmap** (TDD, ~1 184 tests back / 903 front,
> CI multi-lanes, worktrees) restent disponibles en **slides d'appui / annexe** pour le Q&R.

## 7. Recommandations visuelles

- Privilégier **schémas et icônes** plutôt que du texte dense ; un seul visuel fort par slide.
- Code / commandes en **JetBrains Mono** sur fond `--code-bg` sombre.
- Utiliser le **jaune** avec parcimonie (1-2 accents par slide max), le **cyan** pour les actions.
- Cohérence avec l'UI réelle (mêmes couleurs) pour que le deck et la démo se répondent.
