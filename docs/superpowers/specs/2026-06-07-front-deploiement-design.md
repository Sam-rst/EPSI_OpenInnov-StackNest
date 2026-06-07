# Front déploiement — Design (StackNest)

**Date** : 2026-06-07
**Statut** : Design validé en brainstorming → en attente relecture spec → plan d'implémentation
**Épic** : STN-3 Déploiement (partie frontend)
**Dépend de** :
- Backend déploiement — `docs/superpowers/specs/2026-06-07-deploiement-docker-design.md` (contrats API + SSE)
- Catalogue : descripteur de provisioning (agent en cours) **+ champ `engine`** (addendum chaîné, voir §8)

---

## 1. Objectif

Construire l'interface qui permet à un utilisateur de **configurer**, **lancer**, **suivre en temps
réel**, **récupérer les accès** et **gérer le cycle de vie** d'une ressource — en restant **honnête**
sur ce que le moteur fait réellement (Docker au MVP, Terraform plus tard).

---

## 2. Principe directeur : interface « engine-aware »

Chaque template du catalogue porte un **moteur** (`engine: docker | terraform`). Le front adapte le
parcours en conséquence :

| Moteur | Parcours | Statut MVP |
|---|---|---|
| `docker` | Formulaire Docker + **aperçu Docker** + déploiement + suivi live | ✅ Implémenté |
| `terraform` | Formulaire variables + **aperçu HCL** + déploiement | ⏳ Écran **« Déploiement à venir »** (visible, non déployable) |

On ne montre **jamais** un aperçu Terraform pour une ressource Docker, ni un faux déploiement Terraform.

---

## 3. Écrans & routes (routes déjà présentes sur `main`)

| Route | Écran | Rôle |
|---|---|---|
| `/catalog/:id` → « Configurer » | (catalogue) | mène à la config avec le template choisi |
| `/deployments/config?template=:id` | **ConfigPage** | configurer puis lancer |
| `/deployments/:id` | **DeploymentDetailPage** | progression live + accès + actions cycle de vie |
| `/deployments` | **DeploymentsPage** | liste des déploiements de l'utilisateur (nouveau — absent du mockup) |

---

## 4. ConfigPage (adaptative selon `engine`)

Charge le template (API catalogue) → branche selon `engine`.

**`engine === terraform`** → composant `TerraformComingSoon` : message clair « Déploiement Terraform à
venir », pas de formulaire, lien retour catalogue.

**`engine === docker`** (2 colonnes, esthétique mockup conservée) :
- **IdentityCard** : `nom` (requis, validé) · `environnement` (label `dev|staging|prod`).
- **CapacityCard** : `version` (select des versions du template, défaut = LTS) · **params dynamiques**
  rendus depuis `template.params` (type INT/STRING/BOOL/SELECT) · **limites** cpu/mém via presets S/M/L.
- **DockerPreview** (remplace TerraformPreview) : aperçu **live** de la spec conteneur effective —
  `image = {image_repository}:{version}`, ports publiés, env (**secret masqué `••••`**), limites — rendu
  façon `docker run`/compose, avec l'effet *flash* à chaque changement (repris du mockup).
- **Bouton Déployer** → `POST /deployments {template_id, version, params, env, limits}` → redirige vers
  `/deployments/:id`.

> ❌ **Retiré au MVP** : `CostEstimate`, `région`, `backups`, tailles « cloud » (non gérés par le back).

---

## 5. DeploymentDetailPage (progression + live + cycle de vie)

- **DeployHeader** : nom · template (+ badge moteur) · **badge statut** coloré.
- **Stepper Docker** (adapté du stepper générique du mockup) :
  `Validation → Pull image → Création conteneur → Démarrage → Prêt`.
- **StreamedLogs** : logs **live via SSE** (`GET /deployments/:id/events`) — vrais `docker logs`,
  auto-scroll, état terminal (succès/échec).
- **DetailsCard** : image, version, **accès `host:port`**, params, créé le.
- **CredentialsCard** (visible quand `running`) : endpoint + **mot de passe affiché UNE seule fois**
  (issu de l'event SSE « running »), boutons copier, avertissement « non récupérable ensuite ».
- **Actions cycle de vie** (selon statut) : `Démarrer` · `Arrêter` · `Régénérer le mot de passe` ·
  `Détruire` (modale de confirmation). Chaque action → `POST /deployments/:id/{action}`.

---

## 6. DeploymentsPage (liste — nouveau)

- En-tête + bouton **« Nouveau déploiement »** (→ catalogue).
- Table (style « ressources actives » du dashboard) : `nom` · `template` (+ badge moteur) ·
  **badge statut** · accès `host:port` · `créé le` · actions (voir / stop|start / détruire).
- **État vide honnête** : « Aucun déploiement — provisionne ta première ressource depuis le catalogue ».
- États : skeleton (chargement) · empty · error (avec retry).

---

## 7. Temps réel (SSE) & couche données (clean archi front)

`apps/web/src/deployment/` :
- **types/** : `dto/` (miroir API) · `models/` (UI) · `enums/` (`DeploymentStatus`, `EngineKind`) · `guards/`
- **mappers/** : DTO ↔ Model
- **services/** : `deploymentService.ts` (**seam** : fixtures display-only → API réelle)
- **hooks/** :
  - `useDeployments()` / `useDeployment(id)` (React Query)
  - `useDeploymentEvents(id)` : ouvre un `EventSource` sur `/api/deployments/:id/events`, met à jour
    statut + append logs (live)
  - `useDeploymentActions(id)` : mutations stop/start/destroy/regenerate (React Query + invalidation)
- **components/** : compound par écran (config/*, detail/*, list/*) — split > 100 lignes
- **pages/** : `ConfigPage`, `DeploymentDetailPage`, `DeploymentsPage`

---

## 8. Dépendance catalogue : champ `engine` (addendum)

Le front a besoin de `template.engine`. L'agent catalogue en cours ajoute le descripteur Docker
(`image_repository`/`internal_port`/`secret_env`) ; le champ **`engine` (enum `docker|terraform`,
NOT NULL défaut `docker`)** sera un **petit addendum** chaîné juste après cette PR (migration suivante
+ seed : `terraform` pour les ressources non-conteneurisables comme Bucket S3, `docker` sinon + DTO).
Le front consomme `engine` via le détail catalogue.

---

## 9. Stratégie de build : display-only d'abord → branchement

Le backend déploiement (Vagues A→D) est en cours. On construit le front **display-only d'abord** :
- fixtures + **progression simulée** (stepper + logs factices **explicitement étiquetés « exemple »**),
  fidèle au mockup, adapté Docker ;
- structuré pour le **branchement** API + SSE dès que les contrats du back (use cases + endpoints) sont figés ;
- même pattern éprouvé que le catalogue (service-seam → API réelle dans une PR de wiring ultérieure).

Aucun faux credential réaliste : le display-only affiche un exemple **clairement marqué**.

---

## 10. Tests (TDD strict, vitest + MSW + Playwright)

- **Unit** : mappers ; hooks (avec MSW pour services, mock `EventSource` pour SSE) ; composants
  (ConfigPage engine-aware : rend Docker vs « à venir » ; DockerPreview reflète l'état ; CredentialsCard
  n'apparaît que `running` ; actions selon statut) ; états liste (empty/skeleton/error).
- **Integration** : pages assemblées (ConfigPage → submit → navigation ; DetailPage → events SSE
  simulés → stepper/logs/credentials).
- **E2E** (après branchement) : catalogue → configurer → déployer → suivi → accès → détruire.

---

## 11. Périmètre & YAGNI

**Inclus MVP** : ConfigPage Docker (engine-aware) · DeploymentDetailPage (live SSE + cycle de vie) ·
DeploymentsPage (liste) · écran Terraform « à venir » · display-only puis wiring.

**Hors périmètre** : formulaire/preview Terraform réels · estimation de coût · régions/backups/tailles
cloud · graphes de métriques conteneur · pagination/recherche avancée de la liste (post-MVP).

---

## 12. Découpage en slices (pour le plan d'implémentation)

1. **Types + service-seam + mappers** (`deployment/types`, `services`, `mappers`) + fixtures honnêtes.
2. **ConfigPage Docker** (IdentityCard, CapacityCard, DockerPreview, submit) + écran Terraform « à venir ».
3. **DeploymentDetailPage** (header, stepper, StreamedLogs, DetailsCard, CredentialsCard, actions) — progression simulée.
4. **DeploymentsPage** (liste + états vide/skeleton/error).
5. **Branchement API + SSE** (`useDeployment(s)`, `useDeploymentEvents`, `useDeploymentActions`) — après contrats back figés.
6. **Câblage catalogue → config** (bouton « Configurer » réel + lecture `engine`).

Slices 1→4 = display-only, parallélisables (dossiers disjoints dans `deployment/`). Slices 5-6 = wiring,
après le backend. TDD strict, branche + PR + gate par slice.
