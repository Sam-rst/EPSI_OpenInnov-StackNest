# 🏭 Chaîne qualité & industrialisation — StackNest

> Outillage qualité **shift-left** du monorepo (ANAE847). Principe directeur :
> **chaque stack possède ses commandes** ; les hooks git et la CI ne font que les
> **appeler** — aucune logique d'outil n'est dupliquée à la racine.

## 🧱 Architecture en 3 couches

| Couche | Rôle | Fichier |
|---|---|---|
| **Stacks** | *Décrivent* les commandes (composites par concern) | `apps/api/pyproject.toml` (poe) · `apps/web/package.json` (npm) |
| **Root orchestrateur** | *Énumère & délègue* les jobs cross-stack (carte unique) | `pyproject.toml` (racine, poe) |
| **Consommateurs** | *Appellent* les jobs (jamais d'outil en direct) | `.pre-commit-config.yaml` · `.github/workflows/ci.yml` |

Délégation **sans `cd`**, via les flags natifs : `uv run --directory apps/api poe <t>` · `npm --prefix apps/web run <s>`.

## 📋 Composites par stack

| Composite | Back (`uv run poe …`) | Front (`npm run …`) | Concern |
|---|---|---|---|
| **`quality`** | lint + format:check + typecheck | lint + format:check + typecheck | qualité statique |
| **`security`** | `ruff --select S` (bandit) + `pip-audit` | eslint-plugin-security + `npm audit` | sécurité code + deps |
| **`metrics`** | `radon` cc + mi | `eslint complexity` + `jscpd` | *informationnel* |
| **`pre-commit`** | lint + format:check | lint + format:check | hook (check-only) |
| **`pre-push`** | typecheck + test:unit + security | typecheck + test:unit + security | hook |
| **`check`** | quality + security + test:cov | quality + security + test | gate complet ≈ CI |
| `fix` | lint:fix + format | lint:fix + format | **on-demand uniquement** |
| `test:mutation` | `mutmut` | `stryker` | mutation (on-demand / nightly) |

Cross-stack depuis la racine : `uv run poe quality` · `security` · `metrics` · `pre-commit` · `pre-push` · `ci`.

## 🪝 Hooks git (funnel shift-left)

Framework **`pre-commit`** (`.pre-commit-config.yaml`). Installation :

```bash
uv run pre-commit install --install-hooks   # pose pre-commit + pre-push + commit-msg
```

| Stage | Budget | Action | Règle |
|---|---|---|---|
| **commit-msg** | ~instant | format Conventional Commit (+ `STN-XX`) — `scripts/hooks/check_commit_msg.py` | bloque si non conforme |
| **pre-commit** | < ~5 s | `…run pre-commit` (lint + format:check) | **stack modifiée seulement** (`files:`), **jamais de `--fix`** |
| **pre-push** | < ~60 s | `…run pre-push` (typecheck + test:unit + security) | stack modifiée seulement |

> **Vérification, pas correction** : les hooks *constatent* le respect des règles ; ils ne mutent jamais les fichiers stagés. Le dev lance `…run fix` lui-même au besoin. Bypass d'urgence : `git commit/push --no-verify` (toléré, tracé).

## 🤖 CI (`ci.yml`) — 1 job par stack × concern, **ordonnés en workflow**

Même vocabulaire qu'en local (« ce qui tourne en local = ce qui tourne en CI »). Chaque job appelle un **composite** (jamais d'outil brut), setup unique + steps granulaires. Les concerns d'une stack sont **chaînés via `needs`** (fail-fast) :

```
qualité → build → tests → sécurité → métriques
```

| Stack | Chaîne sérielle | metrics (non bloquant) |
|---|---|---|
| **api** | `api-qualite` → `api-build` → `api-test` → `api-securite` | `api-metrics` |
| **web** | `web-qualite` → `web-build` → `web-test` → `web-securite` | `web-metrics` |
| **infra** | `infra-qualite` → `infra-build` → `infra-test` → `infra-securite` | — |

Les 3 stacks tournent **en parallèle** entre elles. **`api-securite` / `web-securite`** appellent les composites **racine englobants** `api-security` / `web-security` = sécu de stack (`:code`) **+ semgrep** (`:sast`, `uvx`) — il n'y a **plus** de jobs `semgrep-api`/`semgrep-web` séparés.

Jobs **transverses indépendants** : `secrets-scan` (gitleaks, historique git) · `outils-test` (tooling Python racine). Sentinelle **`ci-ok`** = AND des **14** jobs bloquants (metrics exclus) → seul *required check*.

**Nightly** (`ci-nightly.yml`) : Trivy, mutation (`mutmut`/Stryker), e2e, SonarCloud.

## 📐 Métriques (le « quoi » qu'on mesure)

| Outil | Stack | Mesure | Dimension ISO 25010 |
|---|---|---|---|
| **radon** `cc`/`mi` | back | complexité cyclomatique, Maintainability Index | Testabilité, Analysabilité |
| **ESLint `complexity`** | front | complexité cyclomatique (seuil 10) | Testabilité |
| **jscpd** | front | duplication (seuil 3-5 %) | Modifiabilité |
| **SonarCloud** | tout | agrégat (bugs, vulns, hotspots, duplication, ratings) | toutes |
| **mutmut / Stryker** | back / front | *mutation testing* — la qualité **des tests** (couverture ≠ détection) | Testabilité |

## ⚙️ Commandes utiles

```bash
# Racine (cross-stack)
uv run poe quality        # qualité statique back + front
uv run poe security       # sécurité back + front
uv run poe metrics        # métriques back + front

# Par stack
uv run --directory apps/api poe metrics      # radon back
npm --prefix apps/web run duplication        # jscpd front
uv run --directory apps/api poe test:mutation  # mutmut (Docker sous Windows)
npm --prefix apps/web run test:mutation        # stryker
```

> Détail de l'audit de maintenabilité (diagnostic ISO 25010, 3 corrections) : [`docs/audit/AUDIT-maintenabilite.md`](../audit/AUDIT-maintenabilite.md).
