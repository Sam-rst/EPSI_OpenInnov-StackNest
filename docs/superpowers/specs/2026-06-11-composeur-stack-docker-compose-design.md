# Composeur de stack Docker Compose — Design v1

> Statut : **validé en brainstorm** (Samuel, 2026-06-11). À implémenter en lots via le
> pipeline multi-agents (dev → review Tech Lead → QA → merge).

## 📋 Contexte

StackNest provisionne aujourd'hui **1 conteneur = 1 déploiement** (Docker SDK), et l'IA du
chat ne propose qu'**un seul template** à la fois (`deploy_template`). Or beaucoup de besoins
réels sont **multi-services câblés** : une API + sa base + un cache, une stack d'observabilité,
etc. On veut un **builder** où l'utilisateur compose une stack depuis le catalogue, déclare les
**liens** entre services, et déploie le tout comme un **projet `docker compose`**.

## 🎯 Périmètre

### v1 (cette spec)
- **Builder manuel** depuis le catalogue : ajout de N services (alias + version + params).
- **Liens explicites** entre services : mapping de variables d'environnement (avec défauts proposés).
- **Déploiement via projet `docker compose`** : génération du compose-file puis `up`/`down`.
- **Gestion 2 niveaux** : niveau **stack** (statut global, déployer / détruire) + niveau
  **service** (statut / logs / accès de chacun).

### Reporté
- **v1.5** : proposition / pré-remplissage d'une stack par l'**IA du chat** (action `deploy_stack`),
  qui ouvre le builder pré-rempli — confirmé « dans un deuxième temps ».
- **v2** : **répliques** par service (scaling horizontal), stop/start d'un service isolé,
  édition d'une stack déjà déployée.

## 🏗️ Architecture (Clean Archi vertical slicing)

- **Back** : nouveau slice `apps/api/app/stack/` (`domain/` `application/` `infrastructure/`
  `presentation/` `worker/`).
- **Front** : nouveau slice `apps/web/src/stack/`.
- **Réutilise** : le **catalogue** (templates + descripteur de provisioning : image / port /
  `secret_env` / `connection_username`), le **worker** (étendu pour compose), les **composants de
  détail déploiement** (Stepper / StreamedLogs / CredentialsCard) pour le niveau service, et la
  **génération de secret worker-side** (jamais persisté).

## 🗃️ Modèle de données (migration Alembic)

- **`stacks`** : `id` (uuid), `owner_id` (FK `users`), `name`, `status`
  (enum `stack_status` : `pending` / `provisioning` / `running` / `partial` / `failed` /
  `destroying` / `destroyed`), `created_at`, `updated_at`.
- **`stack_services`** : `id`, `stack_id` (FK `stacks`, ON DELETE CASCADE), `template_id`
  (FK `templates`), `version`, **`alias`** (nom unique dans la stack — ex. `db`, `api` ; permet
  d'ajouter 2× le même template), `params` (JSONB), `published_port` (nullable, alloué au run),
  `container_ref` (nullable), `service_status` (enum), `order_index`.
- **`stack_links`** : `id`, `stack_id` (FK, CASCADE), **`from_service_id`** (FK `stack_services`,
  le **consommateur**), **`to_service_id`** (FK `stack_services`, le **fournisseur**),
  `var_mappings` (JSONB : `{ ENV_VAR : expression }`).

**Contraintes** : unicité `(stack_id, alias)` ; `from_service_id ≠ to_service_id` ; **graphe
acyclique** (validé applicativement avant provisioning).

## 🔌 API (presentation)

- `POST /stacks` — crée une stack (`name` + `services[]` + `links[]`) → 201 `StackResponse`,
  enfile le provisioning.
- `GET /stacks` — liste des stacks de l'utilisateur.
- `GET /stacks/{id}` — détail : services (statut + accès) + liens.
- `DELETE /stacks/{id}` — détruit la stack (`compose down`).
- `GET /stacks/{id}/events` — flux **SSE** : statut stack **et** par service (réutilise le
  pattern du déploiement).

En v1, **pas d'endpoint d'action par service** (stop/start individuel = v2). **Sécurité** : aucun
secret en réponse ; les params de type `secret` sont masqués (logique `DeploymentResponse`).

## 🎨 Builder (front)

Routes `/stacks` (liste), `/stacks/new` (builder), `/stacks/{id}` (détail temps réel).

- **Volet catalogue** : réutilise `CatalogCard`, filtré aux templates **Docker actifs** (les
  Terraform bloqués ne sont pas ajoutables) → bouton « Ajouter à la stack ».
- **Zone « Stack en cours »** : liste de blocs `StackServiceBlock` (alias éditable, template +
  version, formulaire de params réutilisant la config déploiement, suppression).
- **Liens** : sur un bloc consommateur, « Lier à… » → sélection d'un fournisseur + éditeur de
  mapping (variable → expression). **Mappings par défaut proposés** selon le descripteur du
  fournisseur (s'il a `secret_env` / port / username : propose `DB_HOST` / `DB_PORT` / `DB_USER` /
  `DB_PASSWORD` / une URL assemblée). Friction réduite, l'utilisateur ajuste.
- **Validation** : alias non vides & uniques, ≥ 1 service, pas de lien vers soi, pas de cycle.
- « **Déployer la stack** » → `POST /stacks` → redirection vers `/stacks/{id}`.
- État de composition : `react-hook-form` + `zod`.

## ⚙️ Provisioning (worker)

- **`CreateStackJob`** (arq) : charge la stack, **génère le `docker-compose.yml`**, lance
  `docker compose -p stack_{id} up -d`, remonte les statuts.
- **Génération compose** — pour chaque service :
  - clé compose = **alias** ; image `repo:version` ;
  - **ports** : publie le port interne sur un port host **alloué** (réutilise l'allocateur
    existant, étendu au multi-service) ;
  - **environment** = params (filtrés) + **secret généré** (si `secret_env`) + **vars injectées
    par les liens**, résolues : `{to.alias}` → nom de service compose (DNS interne), `{to.port}` →
    port interne, `{to.secret}` → secret généré du fournisseur, `{to.username}`, `{to.db_name}` ;
  - **networks** : `[stack_net]` (réseau bridge commun → résolution par alias) ;
  - **depends_on** : services fournisseurs.
- **Secrets** : générés worker-side par service qui en déclare (comme aujourd'hui), **jamais
  persistés** ; injectés uniquement dans l'environnement compose.
- **Statut** : global = agrégat des services (`running` si tous up, `partial` si certains,
  `failed` si erreur). SSE par service + global.
- **Destroy** : `docker compose -p stack_{id} down -v` (volumes inclus).
- **Image worker** : ajouter le plugin `docker compose` (le worker monte déjà
  `/var/run/docker.sock`).

## 🔁 Lifecycle 2 niveaux

- **Stack** : `pending` → `provisioning` → `running` / `partial` / `failed` ; `destroying` →
  `destroyed`.
- **Service** : par service, statut + accès (`host:port` publié) + logs (tail). Réutilise
  `Stepper` / `StreamedLogs` / `CredentialsCard` du détail déploiement.

## 🔒 Sécurité

- Secrets **jamais persistés ni renvoyés** (worker-side, environnement conteneur uniquement).
- `var_mappings` contenant un secret : **résolues côté worker**, jamais exposées au REST/SSE.
- Params `secret` **masqués** dans les réponses (logique `DeploymentResponse`).
- **Isolation par owner** : toutes les routes scopées `owner_id`.

## 🧱 Découpage en lots (implémentation)

1. **Socle modèle + migration** + entités domaine + repos (back).
2. **API CRUD stack** (création / list / détail / delete) + use cases + **validation** (alias /
   cycles) (back).
3. **Worker compose** : génération du compose-file + `up`/`down` + statuts/SSE (back, **le plus
   technique** — démarre par un spike `docker compose` CLI dans le worker).
4. **Builder front** (composition + liens + déploiement) + **détail stack** (2 niveaux) (front).
5. *(v1.5)* action IA `deploy_stack` ; *(v2)* répliques.

Chaque lot = **TDD strict** + PR + gate complète, mergé via le pipeline agents
(dev → review → QA → merge). Les lots 1–2 (back) et 4 (front) sont largement disjoints ; le lot 3
dépend de 1–2.

## ⚠️ Risques & mitigations

- **Worker SDK → compose CLI** : ajouter le plugin compose à l'image worker ; valider
  `docker compose` dans le conteneur (socket déjà monté). → le lot 3 **commence par un spike**.
- **Allocation multi-ports** : étendre l'allocateur pour N ports/stack ; réservation pour éviter
  les collisions.
- **UX des var-mappings** (friction / erreurs) : défauts proposés par type + validation ;
  fallback réseau-DNS (l'alias reste résolvable même sans mapping).
- **Cycles de dépendances** : validation applicative (graphe acyclique) avant provisioning.
- **Ressources** : une stack = N conteneurs → surveiller la RAM (les services lourds du catalogue
  restent déconseillés en stack).

## 🧪 Scénarios de test

- **Unit** : validation stack (alias uniques, pas de cycle, ≥ 1 service) ; résolution des
  `var_mappings` ; génération du compose-file (snapshot) ; agrégation du statut.
- **Integ** (testcontainers Postgres) : `POST /stacks` persiste stack + services + links ; GET
  détail ; DELETE ; isolation owner.
- **Worker** (integ/E2E) : génération compose + `up` → conteneurs sur réseau commun + résolution
  par alias + vars injectées ; `down` nettoie.
- **Front** : builder (ajout/suppression service, mapping liens, validation) ; détail stack 2
  niveaux ; sécurité (aucun secret affiché).
- **E2E** : composer une stack (Postgres + API) → déployer → les 2 services `running`, l'API joint
  la BDD par l'alias → détruire.

## ✅ Critères d'acceptation (Given/When/Then) — extraits

- **CA1** — Étant donné le builder, **quand** j'ajoute Postgres puis une app et que je lie l'app à
  Postgres (`DB_HOST` / `DB_PASSWORD`), **alors** au déploiement l'app reçoit ces variables et
  joint la BDD par son alias.
- **CA2** — Étant donné une stack déployée, **quand** j'ouvre son détail, **alors** je vois le
  statut **global** ET le statut/accès de **chaque** service.
- **CA3** — Étant donné une stack, **quand** je la détruis, **alors** tous ses conteneurs et
  volumes sont supprimés (`compose down -v`).
- **CA4** — Étant donné n'importe quelle réponse REST/SSE, **alors** aucun secret généré
  n'apparaît.
