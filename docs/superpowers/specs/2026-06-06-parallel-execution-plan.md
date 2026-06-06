# Plan d'exécution parallèle — v0.2 (auth + catalogue + pages mockup)

> Objectif utilisateur : **maximiser le débit des agents** (parallélisme) **sans sacrifier la qualité**
> (TDD strict + gate complète + review/rapport d'étonnement par PR). Décidé 2026-06-06.

## Principe : socle d'abord, puis fan-out maximal en dossiers disjoints

Le seul moyen de paralléliser N agents sans collision est de **poser d'abord** tout ce qui est
partagé (schéma DB, router, providers, noyau RBAC), puis de découper le reste en **slices = dossiers
possédés** strictement disjoints. Une fois le socle mergé, **aucun agent ne touche** :
`router.tsx`, `App.tsx`, les migrations Alembic, ni le noyau identité/RBAC.

## Étape 1 — SOCLE (séquentiel d'abord ; 2 agents // car `apps/api` ⊥ `apps/web`)

### S1 — Socle back (`feature/STN-socle-back-parallele`)
- `core/config.py` : `Settings` étendu (JWT secret + TTLs, `AUTH_REQUIRE_EMAIL_VERIFICATION`, cookie, rate-limit, CORS origins).
- `main.py` : middleware **CORS `allow_credentials=True`** + origine stricte.
- **Migrations Alembic (tête unique)** : `users` (auth) **puis** `templates`/`template_versions`/`template_params` (catalog) — posées séquentiellement → 1 seule head.
- **Noyau identité/RBAC** (cross-cutting) : `UserModel` + `SqlAlchemyUserRepository` + mapper · `JwtTokenService` (PyJWT) · `BcryptPasswordHasher` · dependencies `get_current_user` + `require_admin` · infra rate-limit Redis.
- Modèles catalog (`TemplateModel`…) posés ici aussi (pour la migration), repo/logique laissés au track catalogue back.
- Tests : unit (TokenService, hasher, VOs) + integ (migration up/down, `get_current_user` avec token minté).

### S2 — Socle front (`feature/STN-socle-front-parallele`)
- `App.tsx` : `QueryClientProvider` (un seul endroit).
- `core/api/` : instancier l'axios client (`baseURL=VITE_API_URL`, `withCredentials:true`) + `tokenStore` (access en mémoire).
- **Router gelé** (`core/router.tsx`) : enregistrer **toutes** les routes + pages placeholder manquantes : `/register`, `/forgot`, `/reset`, `/verify`, `/catalog/:id`, `/deployments/:id` (les autres existent déjà). Chaque track **remplit** ensuite sa page, sans toucher au router.
- Tests : router (toutes routes résolvent), smoke App (QueryClient présent).

> **Contrats d'API** (cf. specs auth & catalogue) figés → front (MSW) et back travaillent en // sur le même contrat.

**Merge** : S1 et S2 mergés en premier (gate + review). `main` devient la base de tous les worktrees fan-out.

## Étape 2 — FAN-OUT (parallèle ; 1 worktree/slot par agent)

| Agent | Track | Branche | Dossiers possédés (exclusifs) |
|---|---|---|---|
| 1 | Auth back (flows + email + CLI) | `feature/STN-auth-back` | `apps/api/app/auth/{application,infrastructure/email,infrastructure/ratelimit,presentation}` |
| 2 | Auth front | `feature/STN-auth-front` | `apps/web/src/auth/**` (pages, AuthContext réel, intercepteur, forms, hooks) |
| 3 | Catalogue back (GET+CRUD+seed) | `feature/STN-catalog-back` | `apps/api/app/catalog/{domain,application,infrastructure,presentation}` |
| 4 | Catalogue front (+detail +admin) | `feature/STN-catalog-front` | `apps/web/src/catalog/{services,hooks,types,mappers,pages}` |
| 5 | Déploiement pages display-only | `feature/STN-deploy-pages` | `apps/web/src/deployment/**` |
| 6 | Chat page display-only | `feature/STN-chat-page` | `apps/web/src/chat/**` |
| 7 | Team + Settings display-only | `feature/STN-team-settings-pages` | `apps/web/src/team/**`, `apps/web/src/settings/**` |

Disjonction : agents back (1,3) = `apps/api` ; agents front (2,4,5,6,7) = sous-dossiers `apps/web/src/<feature>` distincts. Personne ne touche `router.tsx`/`App.tsx`/migrations/noyau RBAC (tout est dans le socle).

### Règle d'honnêteté (agents 5, 6, 7 — pages display-only)
Reproduire fidèlement le mockup `apps/web-mockup` **MAIS** avec **états vides honnêtes** + seams (services fake typés, prêts à brancher le back), exactement comme dashboard (STN-161) et catalogue (STN-46). **Interdiction** : fausses identités (« John Doe »), faux coûts, fausses métriques, fausses listes de déploiements. Si pas de donnée réelle → état vide explicite (« Aucun déploiement », CTA).

### Pages mockup → cibles
- **Déploiement** (agent 5) : `DeploymentsPage` (liste, état vide) · `ConfigPage` (`/deployments/config` : form config display-only) · `DeploymentPage` (`/deployments/:id` : Stepper + StreamedLogs en placeholder, pas de vrai flux).
- **Chat** (agent 6) : `ChatPage` (ConversationsSidebar + MessageList + ChatComposer + PlanBubble/TerraformAside), état vide « démarre une conversation », pas d'appel LLM réel (seam).
- **Team/Settings** (agent 7) : `TeamPage` (mockup `admin` : TeamTable + PermissionMatrix + RoleFilters, état vide / seam) · `SettingsPage` (sections de réglages display-only).

## Qualité (non négociable, tous agents)
- TDD strict Red → Green → Blue, commits par phase (`test(STN-XX): red…` / `feat: green…` / `refactor: blue…`).
- Gate complète avant PR : `typecheck` · `lint --max-warnings 0` · `format:check` · `test --pool=threads --run` · `build` (front) ; `uv run pytest` (back).
- 1 fichier = 1 classe (back) / 1 composant (front). DTO/Model/mapper. Pas de `any`.
- PR avec body conventionnel + **plan de test copier-coller** + rapport d'étonnement (`docs/reviews/`).

## Coordination des merges (par l'orchestrateur)
1. Merge **S1 + S2** (socle) en premier.
2. Fan-out lancé par **vagues** (capacité : ~4-5 agents concurrents) ; je supervise.
3. À la fin de chaque track : **rebase sur main** → gate → review → squash-merge. Sérialisé pour éviter les conflits résiduels (mais dossiers disjoints → conflits attendus quasi nuls).
4. Catalogue CRUD admin (PR Cat-2) et reset (PR C) peuvent suivre leur track respectif sans dépendance croisée (RBAC dans le socle).

## Suivi Jira / découpage
- Specs feature : `2026-06-06-auth-fullstack-design.md`, `2026-06-06-catalogue-fullstack-design.md`.
- Tickets existants : auth STN-78→95, catalogue STN-39→51 (+ déploiement/chat STN-3/4 pour les pages, partie display-only uniquement).
- Tickets manquants (verify email, forgot/reset, rate-limit, socle back/front) → à créer via `/ba` (Phase B), transition « Prêt » par l'utilisateur.

## Risques
- **Tête Alembic** : neutralisée (migrations dans le socle, séquentielles, head unique).
- **Router/App.tsx** : neutralisés (gelés dans le socle).
- **Charge de review** : 7 tracks = beaucoup de PR → lancement par vagues, qualité maintenue par gate + review systématiques.
- **Pages mockup** : risque de réintroduire de fausses données → règle d'honnêteté explicite par agent.
