# Déploiement de ressources Docker — Design (StackNest)

**Date** : 2026-06-07
**Statut** : Design validé en brainstorming, en attente de relecture spec → plan d'implémentation
**Épic** : STN-3 Déploiement (cœur IDP)
**Pré-requis mergés sur `main`** : socle (config, DB/Alembic, RBAC), catalogue (back+front), auth (back+front)

---

## 1. Objectif

Permettre à un utilisateur authentifié de **provisionner réellement** une ressource Docker
depuis le catalogue, d'en suivre la progression en temps réel, d'en obtenir les accès, et de
gérer son **cycle de vie complet** (démarrer / arrêter / régénérer le mot de passe / détruire).

C'est la fonctionnalité **cœur** de l'IDP : elle transforme StackNest d'une vitrine en un
guichet de provisioning autonome.

---

## 2. Décisions structurantes (issues du brainstorming)

| # | Décision | Choix retenu |
|---|---|---|
| 1 | Périmètre cycle de vie MVP | **Cycle complet** : create · stop · start · regenerate-password · destroy |
| 2 | Moteur de provisioning | **Docker SDK (docker-py)** derrière une **interface `Provisioner`** du domaine (pluggable : Terraform/Proxmox plus tard) |
| 3 | Localisation des conteneurs | **Hôte d'exécution séparé** (machine B) ≠ machine du plan de contrôle (machine A) |
| 4 | Canal worker → hôte B | **SSH** : `DOCKER_HOST=ssh://deployer@B` (clé dédiée, zéro gestion de certificats au MVP) |
| 5 | Exposition / accès | **Port publié sur l'hôte B** (port libre, ex. 32768+) → accès `IP_B:port` + identifiants, derrière VPN |
| 6 | File de jobs | **`arq`** (file asynchrone Redis : retries, concurrence) |
| 7 | Persistance | **PostgreSQL = source de vérité** (table `deployments`) ; Redis = file de jobs + bus d'events (transient) |

---

## 3. Architecture — plan de contrôle vs hôte d'exécution

```
   Machine A — StackNest (plan de contrôle)          Machine B — Hôte Docker (exécution)
 ┌──────────────────────────────────────┐          ┌──────────────────────────────────┐
 │ UI · API (FastAPI) · DB (Postgres)   │  SSH      │  dockerd                         │
 │ Redis (file arq + pub/sub)           │ ────────► │   ├─ postgres-<deployment-1>     │
 │ Worker ──(docker-py, DOCKER_HOST)──  │  ssh://   │   ├─ redis-<deployment-2>        │
 │ (ne fait tourner AUCUN workload)     │  deployer@B│  └─ … conteneurs utilisateurs   │
 └──────────────────────────────────────┘          └──────────────────────────────────┘
```

- Le **plan de contrôle** ne fait jamais tourner les workloads utilisateurs (isolation par conception).
- Le **worker** est un service Docker séparé (`worker_main.py`) qui partage le code domaine/infra de l'API.
- L'`Provisioner` reçoit la cible (`DOCKER_HOST`) en config : MVP = 1 hôte ; évolution = pool d'hôtes.

---

## 4. Extension catalogue (slice prérequis)

Le catalogue ne porte aucune métadonnée d'exécution. On ajoute un **descripteur de provisioning**
au niveau `Template` :

| Champ | Type | Rôle | Exemple |
|---|---|---|---|
| `image_repository` | str | Dépôt d'image Docker | `postgres`, `redis`, `nginx` |
| `internal_port` | int \| null | Port écouté dans le conteneur | `5432`, `6379`, `80` |
| `secret_env` | str \| null | Variable d'env recevant le mot de passe généré (null = pas de secret) | `POSTGRES_PASSWORD`, `MYSQL_ROOT_PASSWORD` |

- Image effective = `{image_repository}:{version}` (version = libellé `TemplateVersion`, ex. `postgres:16`).
- Cas sans env secret (ex. Redis via `--requirepass`, ou Nginx sans secret) : `secret_env = null` ;
  l'injection du secret se fait alors via la commande/args (géré par une stratégie par template — voir Risques).
- Travail : migration Alembic (ajout colonnes, **nullable** pour ne pas casser l'existant) + mise à jour
  du seed des 12 templates + DTO catalogue (champs admin uniquement).

---

## 5. Découpage backend `apps/api/app/deployment/`

### domain/
- **entities/** `Deployment` : `id`, `owner_id`, `template_id`, `template_version`, `name`, `status`,
  `params` (JSON), `host`, `published_port`, `created_at`, `updated_at`. (1 ressource par déploiement au MVP.)
- **value_objects/** `ContainerSpec` (image, env, command, ports, limites cpu/mem, labels), `AccessEndpoint` (host, port).
- **enums/** `DeploymentStatus` : `pending`, `provisioning`, `running`, `stopped`, `failed`, `destroying`, `destroyed`.
- **interfaces/** :
  - `Provisioner` : `create(spec) -> ProvisionResult`, `start(ref)`, `stop(ref)`, `destroy(ref)`, `recreate(spec)`, `logs(ref)`.
  - `DeploymentRepository` : CRUD + list par owner.
  - `JobQueue` : `enqueue(job)`.
  - `EventPublisher` / `EventSubscriber` : pub/sub `deployment:{id}`.
- **exceptions/** `DeploymentNotFoundException` (404), `InvalidDeploymentStateException` (409 — transition illégale).
- **factories/** `ContainerSpecFactory` : (template + version + params + secret généré) → `ContainerSpec`.

### application/ (use cases, 1 fichier = 1 classe)
- `CreateDeployment` : valide, persiste `pending`, enqueue job `PROVISION`, renvoie l'id.
- `ListDeployments` / `GetDeployment`.
- `StopDeployment`, `StartDeployment`, `DestroyDeployment`, `RegeneratePassword` : valident la transition d'état puis enqueue le job correspondant.
- `StreamDeploymentEvents` : s'abonne au pub/sub pour le SSE.

### infrastructure/
- **models/** `DeploymentModel` (SQLAlchemy).
- **repositories/** `SqlAlchemyDeploymentRepository`.
- **mappers/** entité ↔ modèle.
- **provisioner/** `DockerSdkProvisioner` (docker-py, `DOCKER_HOST=ssh://`). Implémente `Provisioner`.
- **queue/** `ArqJobQueue` (enqueue) + définitions de jobs.
- **events/** `RedisEventPublisher` / `RedisEventSubscriber` (canal `deployment:{id}`).
- **migration** Alembic : table `deployments`.

### presentation/
- **routers/** :
  - `POST /deployments` (user) — lance un déploiement
  - `GET /deployments` (user) — liste ses déploiements
  - `GET /deployments/{id}` (user, owner) — détail
  - `POST /deployments/{id}/stop|start|destroy|regenerate-password` (user, owner)
  - `GET /deployments/{id}/events` (user, owner) — **SSE** (statut + logs live)
- **schemas/** DTO requête/réponse + mappers. Le mot de passe n'apparaît que dans l'event « running » (une fois).

---

## 6. Worker (`worker_main.py` + `deployment/worker/`)

Boucle consommateur `arq` sur Redis. Types de jobs : **PROVISION / STOP / START / DESTROY / REGENERATE**.

Chaque job :
1. charge le `Deployment` (repo) ;
2. publie l'event de transition (`deployment:{id}`) ;
3. appelle le `DockerSdkProvisioner` (docker-py via SSH) ;
4. met à jour le statut + métadonnées (host, port) en DB ;
5. publie l'event final (running/stopped/destroyed/failed) + logs.

Le worker partage le code domaine + infrastructure avec l'API (même paquet `app/`).

---

## 7. Flux de données

### Création
```
ConfigPage → POST /deployments {template_id, version, params}
  API: valide (template existe, version valide, params) → Deployment(pending) en DB → enqueue PROVISION → 201 {id}
  Worker PROVISION: status=provisioning (event)
     → génère secret → ContainerSpecFactory → DockerSdkProvisioner.create()
     → docker-py(ssh://B): pull image + run (publie port libre de B, limites cpu/mém, labels stacknest)
     → status=running, stocke host+port en DB, publie event "running" + accès (mdp) UNE fois
  UI: GET /deployments/{id}/events (SSE) ← pub/sub → progression + logs + accès affiché une fois
```

### Cycle de vie
- **stop** : `running → stopping → stopped` (docker stop)
- **start** : `stopped → starting → running` (docker start)
- **destroy** : `* → destroying → destroyed` (docker rm -f + cleanup labels)
- **regenerate-password** : nouveau secret → **recrée** le conteneur avec le nouveau env (voir Risques)

### Machine à états
```
pending → provisioning → running ⇄ stopped
                 │            │         │
                 └────────────┴─────────┴──► destroying → destroyed
   (toute étape) ───────────────────────────────────────► failed
```

---

## 8. Sécurité (revue équipe cyber)

- **Plan de contrôle isolé** : aucun workload utilisateur sur la machine A.
- **Accès SSH** : clé dédiée, user `deployer` **non-root** sur B, à durcir (commandes restreintes, `docker` group).
- **Allowlist d'images** : seules les images dérivées des templates du catalogue (`image_repository:version`) ;
  aucune image arbitraire fournie par l'utilisateur.
- **Secrets** : mot de passe généré aléatoirement, injecté en env conteneur, transmis **une seule fois**
  via l'event SSE (TLS), **jamais loggé**, **non stocké en clair** (au plus un hash, ou rien).
- **Limites de ressources** : cpu/mém plafonnés par conteneur (anti-abus).
- **Réseau** : ports publiés accessibles uniquement via le **VPN** du projet.
- **Autorisation** : chaque opération vérifie que le déploiement appartient à l'utilisateur (`owner_id`) — ou admin.

---

## 9. Tests (TDD strict)

- **Unit** : use cases avec fakes (`Provisioner`/`JobQueue`/`Repository`/`EventPublisher`) ; guards de
  transition d'état (InvalidDeploymentState) ; `ContainerSpecFactory` ; génération de secret.
- **Integration** : `SqlAlchemyDeploymentRepository` (testcontainers PostgreSQL) ; `ArqJobQueue` +
  pub/sub (testcontainers Redis).
- **Provisioner** : `DockerSdkProvisioner` testé contre un Docker réel disponible en CI (ou un daemon
  dind dédié au job de test) — sinon mocké en unit.
- **E2E** : scénario `create → running → stop → start → destroy` contre un hôte Docker réel.

---

## 10. Périmètre MVP & YAGNI

**Inclus** : cycle complet sur **1 hôte d'exécution**, **1 ressource par déploiement**, SSE statut+logs,
accès port publié, persistance Postgres, extension catalogue (descripteur provisioning).

**Hors périmètre (post-MVP)** : pool multi-hôtes, Terraform/Proxmox provider, reverse-proxy/sous-domaines
(Traefik), auto-scaling, snapshots/backup, métriques de conteneur, multi-ressources par déploiement.

---

## 11. Risques & points à affiner

| Risque | Mitigation |
|---|---|
| **regenerate-password recrée le conteneur** → une ressource stateful (PostgreSQL) **perd ses données** si le volume n'est pas conservé | MVP : conserver le **volume nommé** entre recréations OU, mieux, stratégie par template (`docker exec` `ALTER USER` pour PG/MySQL) plutôt qu'une recréation. À trancher au plan d'implémentation. |
| **Injection du secret non uniforme** (env vs `--requirepass` vs aucun) | Descripteur `secret_env` + stratégie par template ; commencer par les images à env (`POSTGRES_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `MONGO_INITDB_ROOT_PASSWORD`), cas args (Redis) en second. |
| **Hôte B indisponible / SSH down** | Job `arq` en échec → status=`failed` + event ; retries `arq` bornés ; healthcheck de l'hôte. |
| **Collision de ports sur B** | Laisser Docker publier un port éphémère (`0` → port libre) puis lire le port assigné, plutôt que choisir soi-même. |
| **Nettoyage des orphelins** | Labels `stacknest.deployment_id` sur chaque conteneur → réconciliation possible (job de GC post-MVP). |
| **Dépendance hôte d'exécution réel** (serveur d'Antony / VM Proxmox) | À confirmer côté infra avant l'E2E ; en dev, l'hôte B peut être la machine locale (`DOCKER_HOST` local) pour itérer. |

---

## 12. Découpage en slices (pour le plan d'implémentation)

1. **Extension catalogue** : descripteur de provisioning (`image_repository`, `internal_port`, `secret_env`) + migration + seed + DTO admin.
2. **Socle deployment domain** : entité, VOs, enum, interfaces, exceptions, factory (+ tests unit).
3. **Persistance** : modèle + repository + migration `deployments` (+ tests integ).
4. **File + events** : `ArqJobQueue` + pub/sub Redis (+ tests integ).
5. **Provisioner Docker SDK** : `DockerSdkProvisioner` (SSH) + tests (Docker réel/mock).
6. **Use cases + worker** : create/list/get/stop/start/destroy/regenerate + boucle worker (+ tests).
7. **API + SSE** : routers + DTO + endpoint events SSE (+ tests).
8. **Front (vague suivante)** : ConfigPage (lancer), DeploymentsPage (liste), DeploymentDetailPage (statut/logs live SSE, accès, actions cycle de vie).

Chaque slice = TDD strict, branche dédiée, PR, gate complète. Slices 2→7 majoritairement backend (dossiers
disjoints du reste) → parallélisables après la slice 1 (catalogue) et la slice 3 (head Alembic unique, à sérialiser).
