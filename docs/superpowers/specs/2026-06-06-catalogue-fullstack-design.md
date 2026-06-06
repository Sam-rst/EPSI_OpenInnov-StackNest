# Catalogue full-stack — Design (brainstorm validé 2026-06-06)

> Feature : catalogue de templates (back + câblage front). Epic **STN-1**.
> Front display-only déjà livré (STN-46) : `CatalogPage`, `CatalogCard`, filtres, `templateService` (seam fixtures). Modèle `CatalogItem` plat existant.

## Décisions verrouillées (brainstorm)

| # | Décision | Choix |
|---|---|---|
| 1 | Richesse du modèle | **Riche** : `templates` + `template_versions` + `template_params` (future-proof Déploiement) |
| 2 | Filtrage / liste | **Client-side** : `GET /catalog/templates` renvoie **tout** en cartes légères, le front garde `useCatalogFilters`. Détail `/{id}` = modèle riche. (OK même à ~500 items, petits objets.) |
| 3 | CRUD | **+ CRUD admin** (`require_admin`) en plus du read. `require_admin` étant **dans le socle**, le CRUD reste parallèle (pas de séquencement après auth). |

## Modèle de données — 3 tables (migration posée dans le SOCLE back, tête Alembic unique)

**`templates`** : `id` UUID PK · `slug` varchar unique · `name` · `icon` (slug lucide) · `category` enum `template_category` · `provider` · `description` text · `popular` bool · `tags` text[] · `is_active` bool (def. true) · `created_at`/`updated_at`.

**`template_versions`** : `id` UUID PK · `template_id` FK→templates (ON DELETE CASCADE) · `version` varchar · `is_default` bool · `is_lts` bool · `eol_date` date null · `created_at`. Index `(template_id)`.

**`template_params`** : `id` UUID PK · `template_id` FK→templates (CASCADE) · `key` varchar · `label` · `type` enum `param_type` (`string`,`int`,`bool`,`select`,`secret`) · `required` bool · `default_value` text null · `options` jsonb null (pour `select`) · `order_index` int.

Enum `template_category` : `database`, `cache`, `runtime`, `storage`, `vm`, `network`, `observability`, `security`, `ai`.

## Backend — `apps/api/app/catalog/` (Clean Archi)

- **domain/** : entities `Template`, `TemplateVersion`, `TemplateParam` (guards) · VOs (`Slug`) · enums (`TemplateCategory`, `ParamType`) · interface `TemplateRepository` · exceptions (`TemplateNotFound`, `SlugAlreadyUsed`)
- **application/** : `ListTemplates` · `GetTemplateDetail` · `CreateTemplate` · `UpdateTemplate` · `DeleteTemplate`
- **infrastructure/** : `models/` *(posés dans le socle)* · `SqlAlchemyTemplateRepository` + mapper · `seed/catalog_seed.py` (12 templates enrichis)
- **presentation/** : `routers/catalog_router.py` (`prefix="/catalog"`) · schemas DTO

### Contrats d'API (figés)

| Méthode | Route | Auth | Réponse |
|---|---|---|---|
| GET | `/catalog/templates` | user | `200 [TemplateCardDTO]` (tout, léger) |
| GET | `/catalog/templates/{id}` | user | `200 TemplateDetailDTO` (versions + params) |
| POST | `/catalog/templates` | **admin** | `201 TemplateDetailDTO` |
| PUT | `/catalog/templates/{id}` | **admin** | `200 TemplateDetailDTO` |
| DELETE | `/catalog/templates/{id}` | **admin** | `204` |

- `TemplateCardDTO` = `{id, slug, name, icon, category, provider, tags[], description, popular}` (miroir du `CatalogItem` actuel).
- `TemplateDetailDTO` = card + `versions[] {version, is_default, is_lts, eol_date}` + `params[] {key, label, type, required, default_value, options, order_index}`.
- Endpoints GET protégés par `get_current_user` (app derrière login). CRUD par `require_admin`.

## Frontend — `apps/web/src/catalog/`

> Routes (`/catalog`, `/catalog/:id`) scaffoldées dans le **socle front**. Le track remplit le wiring + la page détail + l'écran admin. Ne touche pas `router.tsx`.

- `types/dto/` (TemplateCardDTO, TemplateDetailDTO, version, param) + `types/models/` (`CatalogItem` léger conservé pour la liste + `TemplateDetail` riche) + `mappers/`
- `services/templateService.ts` : **bascule** `listTemplates()` sur axios `GET /catalog/templates` + mapper (remplace les fixtures) ; `getTemplate(id)` sur `GET /{id}`
- `hooks/` : `useCatalogTemplates` (React Query) ; `useCatalogFilters` **inchangé** (client) ; `useTemplateDetail`
- `pages/CatalogDetailPage.tsx` (`/catalog/:id`) : `TemplateDetailHeader` + tables versions + params + bouton **Déployer** (placeholder → feature Déploiement)
- **Admin** : `pages/CatalogAdminPage.tsx` + form create/update (react-hook-form + zod), gated `RequireAdmin`

## Seed honnête (`catalog_seed.py`)
12 templates réels repris des fixtures (PostgreSQL 16, Redis 7.2, MinIO, Ubuntu 24.04 LTS, Node 20 LTS, Python 3.13, Nginx, Vault, ELK, Ollama, VPC, S3) avec :
- versions LTS/EOL plausibles (ex. PostgreSQL 16 default + 15 LTS),
- params de config typiques (`db_name` string, `port` int, `password` secret, `memory_mb` int…).

**Données de catalogue légitimes** (métadonnées techniques publiques), **aucune fausse donnée/identité utilisateur**.

## Tests (TDD strict)
- **Back** : unit (entities/VOs/use cases avec fakes) · integ (repo + GET endpoints testcontainers, CRUD avec token admin minté) · e2e (liste → détail).
- **Front** : unit (mappers DTO→Model, `useCatalogFilters`) · integ (page liste + détail + admin via MSW sur les contrats) · e2e (parcours catalogue).

## Périmètre
**Inclus** : 3 tables + seed · GET liste/détail · CRUD admin · wiring front + page détail + écran admin.
**Hors périmètre** : déploiement réel (bouton Déployer = placeholder, feature STN-3) · recherche server-side / pagination (filtrage client assumé) · upload d'icônes custom.

## Découpage (PR QA-testables)
- **STN-39** (migration 3 tables) — **dans le socle**.
- **PR Cat-1 — Catalogue read full-stack** : repo + GET endpoints + seed + wiring front (templateService → API) + page détail. QA : `/catalog` charge depuis l'API, `/catalog/:id` montre versions/params.
- **PR Cat-2 — CRUD admin** : Create/Update/Delete endpoints (`require_admin`) + écran admin. QA : en admin, créer/éditer/supprimer un template ; en user, `403`.
