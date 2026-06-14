# StackNest — Guide de démo jury (20 min)

> Scénario minuté pour l'oral EPSI, calé sur le **plan imposé** : **5 min** présentation (blocs 1 → 4)
> · **10 min** démo live (bloc 5) · **5 min** Q&R (bloc 6, données cloud en priorité).
> URLs et commandes exactes à copier-coller. Le front est servi sur **http://localhost:8080**.

---

## 0. Préparation (avant de présenter — pas chronométré)

```bash
# Démarrer la stack en environnement preview (proche prod)
docker compose -f docker-compose.yml -f docker-compose.preview.yml up -d

# Vérifier que tout est sain
docker compose ps
curl -s http://localhost:8080/api/health
curl -s http://localhost:8080/api/version
```

```bash
# Créer un compte admin (saisie interactive du mot de passe)
docker compose exec api python -m app.cli create-admin
```

**Pré-chauffage (anti-cold-start)** — pull à l'avance les images légères qu'on déploiera en live, pour
ne pas attendre un `docker pull` devant le jury :

```bash
docker pull postgres:16-alpine
docker pull redis:7-alpine
docker pull nginx:1.27
docker pull node:20
```

> Conseil : ouvrir les onglets suivants à l'avance — `/login`, `/catalog`, `/chat`, `/stacks`,
> `/dashboard`. Se connecter avec le compte admin avant de commencer.

---

## 1. Présentation (5 min) — plan imposé blocs 1 → 4

> Les 5 min de présentation suivent les **blocs 1 à 4** du plan imposé (problématique/marché →
> présentation appli → stratégie d'insertion → pricing). Le **bloc 5** est la démo (§2 ci-dessous),
> le **bloc 6** est le Q&R (§3). Détail business : `docs/rendu/business-strategie.md`.

| Durée | Bloc | Contenu |
|---|---|---|
| 1 min | **1 — Problématique & besoin** | **Entreprise** : obtenir une ressource = ticket Ops (délai, friction) ou conteneurs à la main (hétérogénéité, secrets en clair). **Étudiant** : une BDD + un runtime pour un TP, en minutes, **budget 0 €**, zéro compétence infra. |
| 1 min | **1 — Marché & concurrents** | 3 familles (PaaS hébergés, IDP, self-hosted open-core). Free tiers en érosion (Heroku/Fly.io). **Ce qu'on fait de mieux** : chat IA qui agit + composeur de stack + catalogue maîtrisé + self-hostable + freemium étudiant 0 €. |
| 1 min | **2 — Présentation de l'appli** | IDP self-hosted, **2 portes** (UI + chat IA), **2 granularités** (service + stack). **Accompagnement** (chat guidé, catalogue cadré), **simplicité** (zéro commande infra), **déploiement rapide** (Docker SDK + SSE). |
| 1 min | **3 — Stratégie d'insertion** | Bottom-up : habituer les **étudiants** (TP gratuits) → ambassadeurs → embauchés → **réintroduction en entreprise** (plan payant). Modèle Docker/GitHub/Figma. |
| 1 min | **4 — Pricing freemium** | **Free 0 €** (TP, non-prod), **Pro ~9 €/u**, **Team ~25 €/u**, **Entreprise sur devis**, **self-hosted gratuit**. Calibré sur le marché (Railway $20/siège, Qovery $29/user, Coolify/Dokploy gratuits). *(Tarifs consultés le 14 juin 2026.)* |

> Réserve de Q&R (bloc 6) : la **stack technique** (FastAPI/Python 3.13, React/Vite/TS, PostgreSQL 16,
> Redis `arq`+SSE, Docker SDK, LLM pluggable) et la **qualité/méthodo** (TDD strict, ~1 184 tests back
> / 903 front, CI multi-lanes, worktrees) sont présentées **à la demande** plutôt qu'en présentation
> initiale, pour laisser la place au volet business.

---

## 2. Démo live (10 min) — plan imposé bloc 5

> La démo **incarne** les arguments des blocs 1 → 4 : catalogue maîtrisé, déploiement rapide, les deux
> différenciateurs (chat IA + composeur de stack), la vue de synthèse. Message à marteler : *« ce qu'un
> étudiant fait gratuitement pour son TP, une entreprise le fait à l'échelle sur un plan payant. »*

### Étape A — Catalogue & gates de déployabilité (≈ 1 min 30)

- Aller sur **http://localhost:8080/catalog**.
- Montrer la **grille** de cartes, **filtrer par catégorie** (ex. *Database*).
- Pointer une **carte bloquée** : une ressource **Terraform** (ex. *VM Ubuntu*, *Bucket S3*) ou un
  **runtime langage** (*Node*, *Python*) → visible mais **non déployable** (roadmap Terraform).
- Phrase clé : « 45 templates, dont **31 déployables** en Docker et **14 volontairement bloqués** —
  on ne propose jamais ce qu'on ne sait pas provisionner proprement. »

### Étape B — Déployer un service live (≈ 2 min 30)

- Depuis une carte **PostgreSQL**, ouvrir le détail (**/catalog/:id**) puis « Déployer ».
- Sur **/deployments/config** : montrer les **paramètres** (db_name, port, mémoire), la version
  **pré-sélectionnée**, lancer le déploiement.
- Sur **/deployments/:id** : commenter le **stepper** + les **logs streamés (SSE)**, puis la **carte
  d'accès** (host:port + **secret affiché une seule fois**).
- Phrase clé : « Le secret est **généré côté worker, jamais stocké**, affiché une fois. »
- Montrer une **action de cycle de vie** : *Arrêter* puis *Démarrer* (statut qui change en direct).

### Étape C — Chat IA : déployer puis composer une stack (≈ 3 min)

- Aller sur **http://localhost:8080/chat**.
- Taper : `Déploie-moi un Redis 7 pour du cache.`
  → l'IA **reformule** et propose une **ActionCard** `deploy` → **Confirmer** → la ressource apparaît
  dans l'aside « contexte live » et dans **/deployments**.
- Taper : `Compose-moi une stack Node + Postgres, l'app doit se connecter à la base.`
  → l'IA propose une **ActionCard `compose_stack`** (services + liens câblés) → ouvre/redirige vers le
  **builder pré-rempli**.
- Phrase clé : « L'IA ne peut proposer **que** ce qui existe au catalogue (boîte à outils fermée +
  validation déterministe), et **rien ne s'exécute sans confirmation**. »

### Étape D — Composeur de stack & détail 2 niveaux (≈ 2 min)

- Sur **http://localhost:8080/stacks/new** (ou le builder ouvert par le chat) : montrer le **volet
  catalogue**, les **blocs de services** (alias éditable, version, params), et un **lien** câblé
  (ex. `DB_HOST = {to.db}`, `DB_PASSWORD = {to.secret}`).
- « Déployer la stack » → redirection vers **/stacks/:id**.
- Montrer le **détail à 2 niveaux** : statut **global** + statut/accès **par service** ; ouvrir une
  **page service** (**/stacks/:id/services/:alias**) avec ses logs.
- Phrase clé : « Le compose-file est passé **par stdin**, il ne touche jamais le disque — donc aucun
  secret persisté. »

### Étape E — Actions en masse & dashboard (≈ 1 min)

- Sur **http://localhost:8080/deployments** (ou **/stacks**) : **sélectionner plusieurs** éléments →
  **barre d'actions en masse** (arrêter / démarrer / supprimer).
- Finir sur **http://localhost:8080/dashboard** : KPIs + ressources actives (vue de synthèse).

---

## 3. Q&R (5 min) — plan imposé bloc 6

> Bloc 6 du plan imposé. **Priorité** : anticiper la **gestion des données client en cloud** (le
> modèle hébergé freemium implique de stocker des données client dans notre cloud). Détail et grille
> complète dans `docs/rendu/business-strategie.md` (§6).

### 3.1 Gestion des données client en cloud (à anticiper en premier)

| Question probable | Réponse |
|---|---|
| **Où sont hébergées les données en mode cloud ?** | **Localisation UE** par défaut ; pour l'offre **Entreprise**, localisation **garantie contractuellement** + option **single-tenant / self-hosted** pour les données sensibles. |
| **Les données sont-elles chiffrées ?** | **In-transit** (TLS) et **at-rest** (base + volumes chiffrés). Les **secrets** ne sont **jamais persistés** (générés worker-side, affichés une fois) ; le compose-file transite **par stdin**, jamais sur disque. |
| **RGPD / DPA ?** | Données minimales (email + nom, pas d'IP), âge ≥ 18 ans, privacy by design (Ollama on-premise) & by default (rôle minimal), **droit à l'oubli** en cascade, **rétention bornée**, **DPA** fourni pour Pro/Team/Entreprise. |
| **Réversibilité / lock-in ?** | **Export** et **réversibilité** garantis ; **self-hosted open-core** permet de tout rapatrier sur son serveur — anti-lock-in. |
| **Isolation multi-tenant ?** | Scoping `owner_id` partout ; plan de contrôle ≠ hôte d'exécution ; **single-tenant** dédié pour l'Entreprise. |
| **Données traitées par l'IA ?** | Le LLM **ne voit jamais un secret** ; en **Ollama on-premise**, aucune donnée ne sort du serveur ; recours tiers signalé et désactivable. |

### 3.2 Questions techniques & business

| Question probable | Réponse |
|---|---|
| **Pourquoi un freemium et pas du payant direct ?** | Stratégie **bottom-up** : on capte l'étudiant gratuitement (TP, non-prod), il devient ambassadeur, l'entreprise paie. Le Free est calibré pour qu'une entreprise **ne puisse pas y échapper**. |
| **Vos prix tiennent-ils face aux concurrents ?** | Free plus généreux que Railway/Heroku/Fly.io ; Pro **sous** le marché (~9 € vs $20-29) ; Team aligné (Qovery $29/user, Render $25) ; self-hosted gratuit (Coolify/Dokploy). *(Consulté le 14 juin 2026.)* |
| **Pourquoi FastAPI et pas Django ?** | Async natif indispensable au **SSE** et aux appels **LLM streaming** ; Pydantic réutilisé pour valider les sorties LLM ; Clean Archi naturelle (DI), là où Django couple ORM et vues. |
| **Comment évitez-vous les hallucinations de l'IA ?** | Défense en profondeur : **boîte à outils fermée** (le LLM ne voit que le catalogue réel), **validation déterministe** des arguments, le LLM **ne voit jamais un secret**, **confirmation obligatoire**, garde-fous métier (refus hors catalogue, rate-limit). |
| **Où sont stockés les mots de passe des ressources ?** | **Nulle part** : générés côté worker au provisioning, injectés dans l'environnement du conteneur, **affichés une fois**. Les params secrets sont masqués dans les réponses. (Détail RGPD : §3.1 ci-dessus.) |
| **C'est vraiment déployé ou c'est mocké ?** | Vrai : Docker SDK lance de vrais conteneurs sur un **hôte d'exécution séparé** ; on le voit avec `docker ps`. |
| **Pourquoi des cartes Terraform si elles ne marchent pas ?** | Elles montrent la **cible produit** ; le moteur est **pluggable** (interface `Provisioner`), Terraform/Proxmox est la **roadmap** — au MVP elles sont **bloquées** pour ne pas mentir à l'utilisateur. |
| **Coût du LLM ?** | Ollama local = 0 € par défaut ; port agnostique pour brancher OpenAI/Anthropic si besoin ; rate-limit / budget de tokens prévus. |
| **Combien de tests ?** | ~**1 184** côté back (pytest), **903** côté front (Vitest), TDD strict, gates CI bloquants. |
| **Comment avez-vous travaillé à plusieurs sur le même repo ?** | **Worktrees multi-agents** : chaque dev/agent dans un worktree isolé avec sa propre stack Docker (ports décalés), zéro collision. |

---

## 4. Plan B (si un pull/déploiement traîne)

- **Services légers déjà en cache** (pré-pull à l'étape 0) : préférer **nginx**, **redis**,
  **postgres** pour la démo live — démarrage quasi instantané.
- Si le **chat** est lent (cold-start d'un modèle Ollama local) : basculer sur un provider rapide
  pré-configuré (`LLM_PROVIDER`), **ou** montrer l'**ActionCard** déjà obtenue lors du pré-chauffage,
  **ou** utiliser un déploiement déjà lancé en étape 0.
- Si un **déploiement** met du temps : pendant le SSE, commenter l'architecture (plan de contrôle vs
  hôte d'exécution) — le temps de provisioning devient un argument pédagogique.
- En dernier recours : montrer une ressource **déjà `running`** créée avant la démo, et dérouler le
  cycle de vie (stop/start) sur celle-ci.

---

## 5. Nettoyage (après la démo)

```bash
docker compose -f docker-compose.yml -f docker-compose.preview.yml down -v
```
