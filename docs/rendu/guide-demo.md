# StackNest — Guide de démo jury (20 min)

> Scénario minuté pour l'oral EPSI. **5 min** présentation · **10 min** démo live · **5 min** Q&R.
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

## 1. Présentation (5 min)

| Durée | Contenu |
|---|---|
| 1 min | **Problème** : obtenir une ressource = ticket Ops (délai, friction) ; ou conteneurs à la main (hétérogénéité, secrets en clair). |
| 1 min | **StackNest** : IDP self-hosted, guichet unique, **2 portes** (UI + chat IA), **2 granularités** (service + stack). |
| 1 min | **Personas** : étudiant (Lucas), dev senior (Sarah), lead PME (Marc). Différenciateur = chat IA + composeur de stack. |
| 1 min | **Stack technique** : FastAPI/Python 3.13, React/Vite/TS, PostgreSQL 16, Redis (`arq` + SSE), Docker SDK, LLM pluggable (Ollama/OpenAI/Anthropic). |
| 1 min | **Qualité & méthodo** : TDD strict, ~1 184 tests back / 903 front, CI multi-lanes, Clean Archi vertical-slicing, dev multi-agents en worktrees. |

---

## 2. Démo live (10 min)

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

## 3. Q&R (5 min) — questions probables & réponses

| Question probable | Réponse |
|---|---|
| **Pourquoi FastAPI et pas Django ?** | Async natif indispensable au **SSE** et aux appels **LLM streaming** ; Pydantic réutilisé pour valider les sorties LLM ; Clean Archi naturelle (DI), là où Django couple ORM et vues. |
| **Comment évitez-vous les hallucinations de l'IA ?** | Défense en profondeur : **boîte à outils fermée** (le LLM ne voit que le catalogue réel), **validation déterministe** des arguments, le LLM **ne voit jamais un secret**, **confirmation obligatoire**, garde-fous métier (refus hors catalogue, rate-limit). |
| **Où sont stockés les mots de passe des ressources ?** | **Nulle part** : générés côté worker au provisioning, injectés dans l'environnement du conteneur, **affichés une fois**. Les params secrets sont masqués dans les réponses. |
| **Et la RGPD ?** | Données minimales (email + nom), pas d'IP stockée, âge 18 ans, **Ollama on-premise par défaut** (données ne quittent pas le serveur), droit à l'oubli en cascade, rétention bornée. |
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
