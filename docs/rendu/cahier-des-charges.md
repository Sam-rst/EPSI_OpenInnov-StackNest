# StackNest — Cahier des charges (tel que réalisé / cible)

> Reformulation propre du besoin et des exigences, alignée sur l'état **réel** du code à la date de
> rédaction. Les exigences marquées *(roadmap)* ne sont pas encore implémentées.

---

## 1. Besoins

StackNest est une **Internal Developer Platform (IDP)** : un guichet unique permettant à une équipe
technique de **provisionner des ressources IT en autonomie** (bases de données, caches, services,
runtimes, stacks multi-services), sans passer par un ticket Ops, et avec un cadrage de la plateforme
(catalogue maîtrisé, versions, sécurité). Deux portes d'entrée : **UI web** et **assistant IA**.

### 1.1 Problématique & définition du besoin (cas entreprise + cas étudiant)

Le besoin d'**autonomie encadrée** vise **deux publics** :

- **Cas entreprise** — obtenir une ressource passe par un **ticket Ops** (délai, friction) ou par des
  conteneurs « à la main » (hétérogénéité, versions EOL, secrets en clair). Besoin : **rendre les
  équipes autonomes** tout en **gardant le contrôle**.
- **Cas étudiant** — pour un **TP / projet de cours**, il faut une BDD + un runtime **en minutes**,
  **budget 0 €**, **sans compétence infra**. Besoin : **provisionner vite et gratuitement**.

### 1.2 Personas

| Persona | Profil | Cas | Besoin | Plan cible |
|---|---|---|---|---|
| **Lucas, 21 ans** | Étudiant | Étudiant (TP) | BDD + runtime en < 2 min, budget 0 €, zéro infra | **Free** / self-hosted |
| **Sarah, 32 ans** | Dev senior | Entreprise | Sandbox isolé pour tester une migration sans impacter l'équipe | **Pro / Team** |
| **Marc, 38 ans** | Lead dev PME | Entreprise | Automatiser des envs de test, budget maîtrisé, souveraineté | **Team / Entreprise** ou self-hosted |

> Le cas étudiant (Lucas, gratuit) **alimente** le cas entreprise : devenu salarié, l'ancien étudiant
> **réintroduit** StackNest dans son équipe (stratégie d'insertion *bottom-up*, cf.
> `docs/rendu/business-strategie.md`).

### 1.3 Besoins primaires

1. Parcourir un catalogue de ressources et en consulter le détail (versions, paramètres).
2. Déployer une ressource réelle et en suivre la progression en temps réel.
3. Gérer le cycle de vie d'une ressource (arrêter, démarrer, régénérer le secret, détruire).
4. Composer une **stack multi-services** câblée et la déployer en un projet `docker compose`.
5. Décrire son besoin **en langage naturel** et faire proposer une action confirmable par l'IA.
6. S'authentifier de façon sécurisée et ne voir que ses propres ressources.

---

## 2. Exigences fonctionnelles (« Le système doit… »)

### 2.1 Authentification & comptes

- Le système **doit** permettre l'inscription via email + nom + mot de passe, avec acceptation des
  CGU et **âge minimum 18 ans**.
- Le système **doit** envoyer un email de **vérification** et n'activer pleinement le compte qu'après
  vérification.
- Le système **doit** authentifier par **JWT** (token d'accès court + token de rafraîchissement) et
  permettre le logout.
- Le système **doit** gérer un parcours **mot de passe oublié** (demande + réinitialisation).
- Le système **doit** appliquer un **RBAC** à deux rôles (`admin`, `user`) et créer tout compte avec
  le rôle `user` par défaut.
- Le système **doit** fournir une commande CLI `create-admin` (aucun credential par défaut en clair).
- Le système **doit** prendre en charge le **MFA TOTP**. *(roadmap)*

### 2.2 Catalogue

- Le système **doit** exposer un catalogue de templates avec catégories, versions et indicateurs
  **LTS/EOL**, et pré-sélectionner la version par défaut.
- Le système **doit** permettre le **filtrage** (catégorie) et la consultation du **détail** d'un
  template avec ses paramètres configurables.
- Le système **doit** distinguer les ressources **déployables** (Docker) des ressources **non
  déployables** au MVP (moteur Terraform, runtimes langage), et **bloquer** le déploiement de ces
  dernières tout en les affichant.
- Le système **doit** offrir un **CRUD admin** des templates.

### 2.3 Déploiement

- Le système **doit** permettre de déployer une ressource Docker à partir d'un template + version +
  paramètres validés.
- Le système **doit** provisionner réellement le conteneur sur un **hôte d'exécution séparé** du plan
  de contrôle.
- Le système **doit** diffuser la progression du déploiement en **temps réel (SSE)**.
- Le système **doit** générer les secrets **côté worker**, ne **jamais** les persister, et les
  afficher **une seule fois**.
- Le système **doit** offrir le **cycle de vie complet** : arrêter, démarrer, régénérer le secret,
  détruire.
- Le système **doit** lister les déploiements de l'utilisateur et en exposer le détail (accès, statut).
- Le système **doit** permettre des **actions en masse** (arrêter/démarrer/supprimer plusieurs
  déploiements sélectionnés).

### 2.4 Composeur de stack

- Le système **doit** permettre d'assembler une stack de N services depuis le catalogue (alias +
  version + paramètres).
- Le système **doit** permettre de déclarer des **liens** entre services et de **câbler des variables
  d'environnement** par expressions (`{to.alias}`, `{to.port}`, `{to.secret}`, `{to.username}`,
  `{to.db_name}`), avec des défauts proposés.
- Le système **doit** valider la composition (alias uniques, ≥ 1 service, **graphe acyclique**).
- Le système **doit** déployer la stack comme un **projet `docker compose`**, en transmettant le
  compose-file **par stdin** (jamais sur disque).
- Le système **doit** présenter un détail **à deux niveaux** : statut global de la stack + statut,
  accès et logs **par service**.
- Le système **doit** détruire une stack et **ses volumes** (`compose down -v`).
- Le système **doit** offrir des **actions en masse** sur les stacks.

### 2.5 Chat IA

- Le système **doit** comprendre une intention en langage naturel et la **mapper sur le catalogue
  réel**.
- Le système **doit** proposer des actions (`deploy`, `stop`, `start`, `regenerate`,
  **`compose_stack`**) sous forme d'une **carte de confirmation** reformulant l'intention, sans
  jamais exécuter sans confirmation.
- Le système **doit** streamer la réponse de l'assistant **token par token (SSE)**.
- Le système **doit** gérer plusieurs **fils de discussion** par utilisateur (créer / renommer /
  supprimer / sélectionner).
- Le système **doit** s'appuyer sur un **port LLM agnostique** permettant de brancher Ollama, OpenAI
  ou Anthropic, sans changer la logique métier.
- Le système, lors de la confirmation, **doit** déléguer aux use cases de déploiement/stack existants
  (aucune duplication).

### 2.6 Dashboard

- Le système **doit** présenter une vue de synthèse (KPIs, ressources actives) agrégée à partir des
  déploiements et stacks.

### 2.7 Exigences business *(hypothèse — modèle hébergé freemium + self-host open-core, à valider)*

> Ces exigences cadrent le **modèle économique cible** (cf. `docs/rendu/business-strategie.md`). Elles
> sont des **hypothèses stratégiques** non implémentées au MVP.

- Le système **devrait** supporter un **modèle freemium** : un **tier Free** calibré pour l'usage
  pédagogique (quotas serrés — nb de déploiements/stacks, ressources, rétention courte, **usage
  non-production**, 1 utilisateur) et des tiers **payants** (Pro / Team / Entreprise) débloquant
  davantage de ressources, RBAC/SSO, support et SLA. *(roadmap)*
- Le système **devrait** appliquer des **quotas par plan** (déploiements actifs, ressources allouées,
  rétention des logs, budget de tokens LLM). *(roadmap)*
- En mode **hébergé (SaaS)**, le système **doit** garantir une **isolation multi-tenant** (scoping par
  `owner_id` déjà en place ; **single-tenant** dédié pour l'offre Entreprise), une **localisation des
  données dans l'UE**, le **chiffrement at-rest et in-transit**, la **réversibilité / export** des
  données, et un **DPA** pour les offres payantes. *(roadmap pour l'offre hébergée)*
- Le système **doit** rester **self-hostable** (cœur open-core déployable par l'utilisateur sur son
  propre serveur), afin de préserver la **souveraineté** et l'**anti-lock-in**. *(déjà vrai au MVP)*

---

## 3. Exigences non fonctionnelles

### 3.1 Performance & temps réel

- Les appels longs (provisioning, LLM) **doivent** être **non bloquants** (async natif FastAPI, file
  `arq`). Le retour utilisateur **doit** être **temps réel** via SSE.

### 3.2 Sécurité

- Les **secrets** ne **doivent jamais** être persistés ni renvoyés par l'API/SSE (générés worker-side,
  injectés dans l'environnement du conteneur uniquement, affichés une fois).
- Le compose-file d'une stack **ne doit jamais** toucher le disque (transmis par stdin).
- L'IA **doit** être protégée contre l'hallucination par une **défense en profondeur** (boîte à
  outils fermée, validation déterministe des arguments, confirmation obligatoire, garde-fous métier).
- Toutes les ressources **doivent** être **scopées par propriétaire** (`owner_id`).
- Le plan de contrôle **ne doit jamais** exécuter les workloads utilisateurs (isolation).
- La CI **doit** comporter des contrôles de sécurité (SAST, scan de secrets, audit dépendances).

### 3.3 Disponibilité & résilience

- Les services de base (db, redis, api) **doivent** exposer des **healthchecks** Docker.
- Les jobs de provisioning **doivent** bénéficier de **retries** (file `arq`).
- L'état d'un déploiement **doit** suivre une **machine à états** explicite, sans état incohérent.

### 3.4 RGPD & confidentialité

- Le système **doit** collecter le **strict minimum** (email + nom), **sans IP stockée**.
- L'IA **doit** fonctionner **on-premise par défaut** (Ollama) ; tout recours à un tiers **doit** être
  signalé à l'utilisateur.
- Le système **doit** appliquer **privacy by default** (rôle minimal) et prévoir le **droit à
  l'oubli** (cascade) et des durées de **rétention** bornées.

### 3.5 Maintenabilité & qualité

- Le code **doit** suivre la **Clean Architecture + vertical slicing** (back et front),
  **1 fichier = 1 classe / composant**, séparation DTO/Model côté front.
- Tout développement **doit** suivre le **TDD strict** (Red → Green → Blue), avec couverture cible
  **80 % global / 90 % logique métier**.
- Les gates **lint / format / typecheck / tests** **doivent** être **bloquants** en CI
  (`eslint --max-warnings 0`, `prettier --check`, `mypy`, `ruff`).

### 3.6 Portabilité

- L'ensemble **doit** se lancer via **Docker Compose** (base + overrides d'environnement).
- Le moteur de provisioning **doit** être **pluggable** (Docker SDK au MVP, Terraform/Proxmox cible).

---

## 4. Périmètre

### Inclus (MVP livré)

Auth complète (JWT + vérif email + reset), catalogue 45 templates avec gates de déployabilité,
déploiement Docker live + cycle de vie, composeur de stack Docker Compose, chat IA (deploy +
compose_stack), dashboard, actions en masse, CI multi-lanes, worktrees multi-agents.

### Exclu (post-jury)

MFA TOTP ; cycle de vie **par service** des stacks et édition d'une stack déployée ; répliques /
scaling ; vraie **pause** conteneur ; provisioning **Terraform/Proxmox** (cartes infra bloquées) ;
2ᵉ LLM « juge » ; recherche/partage de fils de chat ; pièces jointes ; RAG sur la doc ; site vitrine
et documentation in-app B1 ; gestion de quotas et estimation de coûts.

---

## 5. Contraintes

- **Technologies imposées / retenues** : FastAPI + Python 3.13, React + Vite + TS, PostgreSQL 16,
  Redis 7, Terraform, Docker, GitHub Actions.
- **Infrastructure** : VM Proxmox sur le **serveur d'Antony**, accès **VPN** (pas de ports ouverts
  hors HTTP/SSH), budget 0 €.
- **4 environnements** (`dev`, `test`, `preview`, `prod`), **un seul actif à la fois** (contrainte
  ressources serveur) ; **CD toujours manuelle** (`workflow_dispatch`).
- **CI cloud** (runner GitHub) + **CD self-hosted** (runner sur le serveur d'Antony, zéro port
  entrant).
- **UI 100 % en français** ; commits en français référençant `STN-XX`.
- **LLM on-premise par défaut** (RGPD) ; clés de fournisseurs tiers jamais commitées (SOPS en
  preview/prod).

---

## 6. Planning sur 2 ans (jalons)

| Phase | Période | Versions | Contenu |
|---|---|---|---|
| Phase 1 | 14-19 avril 2026 | v0.1.0 | Setup projet + 4 environnements |
| Phase 2 | 19 avril - 10 mai | v0.2.0 → v0.4.0 | Catalogue + worker + déploiement (**MVP démonstrable**) |
| Phase 3 | 10-24 mai | v0.5.0, v0.6.0 | Auth complète + historique/gestion |
| Phase 4 | 24 mai - 7 juin | v0.7.0, v0.8.0 | Chat IA + dashboard ; + composeur de stack |
| Prép. oral | 7-16 juin | — | Vidéo démo, slides, entraînement, bugfixes |
| Phase 5 | Sept. 2026+ | v0.9.0+ | MFA, Terraform/Proxmox, audits cyber, docs B1, site vitrine |
| Phase 6 | Janv.-juin 2027 | v1.0.0 | Bêta-testing, commercialisation |

> Jalons : MVP démontrable dès la v0.4.0 ; feature-complete pour le jury à la v0.8.0 (feature freeze
> le 7 juin) ; oral mi-juin 2026.

---

## 7. Critères d'acceptation globaux

1. Un utilisateur authentifié **peut déployer** une ressource Docker du catalogue et en suivre la
   progression **en temps réel**, puis en gérer le **cycle de vie complet**.
2. Le **secret** d'une ressource n'apparaît **jamais** en base ni dans une réponse API/SSE, et est
   affiché **une seule fois**.
3. Une **stack multi-services** peut être composée avec des liens câblés, déployée comme projet
   `docker compose`, et détruite avec ses volumes ; le détail montre le statut **global et par
   service**.
4. Le **chat** propose une action (déploiement **ou** composition de stack) reformulée et confirmable,
   sans jamais exécuter sans confirmation, et sans proposer de ressource hors catalogue.
5. Une ressource **Terraform/runtime bloquée** est **visible mais non déployable**.
6. La suite de tests passe (back + front) et les **gates** lint/format/typecheck/tests sont verts en
   CI ; couverture conforme aux cibles.
