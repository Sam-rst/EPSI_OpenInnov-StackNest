# 🔬 Audit d'analyse de code & maintenabilité — StackNest

> **Module ANAE847 × MSPR** · binôme · audit sur **StackNest v0.78.0** · ~25 000 LOC
> Référentiel : **ISO/IEC 25010**. Outils : SonarCloud · ruff · ESLint · Semgrep · **radon** · jscpd.
> _Doc de travail — source du deck (10 slides) et de la note d'usage IA. Ticket : STN-179._

---

## 1. Projet audité & périmètre

StackNest — *Internal Developer Platform* (FastAPI + React/TS + PostgreSQL + Redis + worker arq + LLM pluggable), **MVP v0.78.0**. Périmètre **réellement analysé** : `apps/api` (back Python), `apps/web` (front TS), `infra/` (Terraform), `.github/workflows` (CI), tests (back+front), docs. _Hors périmètre : `apps/web-mockup` (archive design, hors quality gate)._

## 2. Cartographie de l'existant

Monorepo modulaire · **Clean Architecture + vertical slicing** (back **et** front) · **plan de contrôle ≠ hôte d'exécution** (`DOCKER_HOST`). Slices : `auth, catalog, deployment, stack, chat, dashboard…`. _(Schéma : `docs/architecture/architecture.mmd`.)_

## 3. Méthode d'analyse

- **Statique** (sans exécution) : AST → CFG → flot de données → règles. Complétée par les **tests** (dynamique).
- **Critères = ISO/IEC 25010** (5 sous-caractéristiques de la maintenabilité). Chaque métrique = **proxy** d'une dimension :

| Métrique | Dimension ISO 25010 | Outil |
|---|---|---|
| Complexité cyclomatique / cognitive | Testabilité, Analysabilité | radon, SonarCloud |
| Maintainability Index | (agrégat) | radon |
| Couplage / cohésion | Modularité, Réutilisabilité | revue archi, Sonar |
| Duplication | Modifiabilité | SonarCloud, jscpd |
| Vulnérabilités / hotspots | Sécurité | SonarCloud, Semgrep |

## 4. Diagnostic global (métriques réelles)

**SonarCloud** (`Sam-rst_EPSI_OpenInnov-StackNest`) :

| Métrique | Valeur | Lecture |
|---|---|---|
| Bugs | **0** | Fiabilité **A** |
| Vulnérabilités | **4** (toutes `secrets:S6698`) | Sécurité **E** ⬅️ *seule métrique rouge* |
| Security hotspots | 4 (0 % relus) | à traiter |
| Code smells | 219 | Maintenabilité **A** (dette plafonnée) |
| **Duplication** | **0,4 %** | ✅ < seuil 3-5 % |
| Couverture | ~95 % (gate ≥ 80 %) | ✅ |
| LOC | ~25 000 | — |

**radon (back Python)** — complexité cyclomatique :
- **Une seule fonction de production > seuil McCabe (10)** : `ActionArgsGate._validate_params` → **CC 13** (rang C).
- Tout le reste du code de prod : **rang A/B** (CC ≤ 10). MI élevé partout (aucun fichier prod en rang B/C).

➡️ **Forces** : architecture découplée (Clean Archi/DI), duplication ~0 %, couverture élevée, 0 bug, gates CI + shift-left. **Faiblesses** : `security_rating = E` (secrets en dur dev), 1 fonction au-dessus du seuil de complexité, hotspots non relus.

---

## 5. 🎯 Point critique n°1 — Sécurité : secret en dur (`security_rating = E`)

- **Constat** : 4× `secrets:S6698` (BLOCKER) sur le couple dev `stacknest:stacknest` → **seule métrique Sonar rouge** (Sécurité **E**). Source : `config.py:33` + `docker-compose.yml` ×3.
- **✅ Correction (effective)** — `config.py` : le défaut n'embarque **plus de mot de passe en source** :
  - **AVANT** : `database_url = "postgresql+asyncpg://stacknest:stacknest@localhost:5432/stacknest"`
  - **APRÈS** : `database_url = "postgresql+asyncpg://stacknest@localhost:5432/stacknest"`
  - *(commit `fix(STN-179)` · Settings charge OK · 45 tests `core` verts · ruff clean · démo-neutre : compose/`.env`/SOPS fournissent l'URL réelle)*
- **✅ Démonstration « satisfaisant »** — les 3 occurrences `docker-compose.yml` = **safe-by-design prouvé** : Postgres conteneurisé **éphémère**, jamais exposé ; en preview/prod `DATABASE_URL`/`POSTGRES_PASSWORD` injectés par la CD via **SOPS**. Aucun secret réel déployé.
- **Justification** (cours ch. 6) : « ne jamais coder en dur un credential » ; marquer **explicitement** l'exception plutôt que désactiver la règle.
- **Bénéfice** : dimension **Sécurité** — plus aucun mot de passe littéral en source.

## 6. 🎯 Point critique n°2 — Complexité : `ActionArgsGate._validate_params`

- **Constat** : **seule fonction de production > seuil McCabe (10)** sur tout le back → **CC 13** (rang C, « refactoring recommandé »), due à 4 compréhensions dont une à double `and`. Fonction **sécurité-critique** (gate anti-hallucination du chat).
- **✅ Correction (TDD)** — **extract method** : chaque compréhension extraite en helper nommé (`_unknown_params`, `_missing_required_params`, `_strip_secrets`).
  - **AVANT / APRÈS (radon)** : `_validate_params` **CC 13 (rang C) → 4 (rang A)** ; helpers tous rang A (2-5).
  - **Tests** : **57 verts AVANT ET APRÈS** (comportement strictement inchangé) · ruff clean · *(commit `refactor(STN-179)`)*.
- **Justification** (cours ch. 4 & 7) : extract method + fonctions nommées (réduit la complexité **cognitive** par aplatissement) ; refactoring **discipliné** (aucune feature, tests = filet, petites étapes, commit dédié).
- **Bénéfice** : **Testabilité** (moins de chemins par fonction) + **Analysabilité** (intentions nommées).

## 7. 🎯 Point critique n°3 — Industrialisation + démonstration couplage/duplication

### 7a. ✅ Correction (effective) — gate Checkov restauré bloquant

- **Constat** : la lane sécu infra (`security-infra`) avait été passée en **`soft_fail: true`** (gate volontairement **non-bloquant**) → faiblesse d'**industrialisation / capacité à livrer**.
- **Correction** : `soft_fail` **retiré** (les 2 étapes Terraform + Dockerfile), après **preuve locale de 0 violation** : Checkov **Terraform 0 failed**, **Dockerfile 179 passed / 0 failed**. *(commit `ci(STN-179)`)*.
- **Justification** (cours ch. 8) : un gate qui n'est pas **bloquant** « ne sert à rien » ; principe **« Clean as You Code »** — tout nouveau finding bloque désormais la PR.
- **Bénéfice** : **capacité à livrer** (gate de qualité réel restauré, sans dette muette).

### 7b. ✅ Démonstration « déjà satisfaisant, prouvé » — couplage & duplication

- **Duplication = 0,4 %** (SonarCloud) → **bien < seuil 3-5 %**. *Rien à factoriser* : appliquer la **règle des trois** prématurément créerait un couplage artificiel (« DRY n'est pas un dogme »).
- **Couplage faible prouvé** par **inversion de dépendance** (D de SOLID) : ports/adapters — `Provisioner` (Docker SDK / compose), `LLMProvider` (Ollama/OpenAI/Anthropic), `EmailSender`. Les use cases dépendent d'**interfaces**, pas d'implémentations → testables par doubles, substituables sans toucher la logique.
- **Justification** (cours ch. 5) : couplage↓/cohésion↑, DI. **« La localisation prime sur le décompte »** : on ne refactorise pas une métrique déjà verte.
- **Bénéfice démontré** : **Modularité** + **Modifiabilité** déjà sous contrôle (jugement d'ingénieur : ne pas sur-refactoriser).

---

## 8. Tests, documentation & livraison

- **Testabilité** : TDD strict (Red→Green→Blue), ~1 184 tests back + ~903 front, ~95 % couverture.
- **Documentation** : README, ONBOARDING, rapport technique, dossier de rendu, ROADMAP.
- **Capacité à livrer** : 1 commande (`docker compose … up`), migrate one-shot, **CI multi-lanes + `ci-ok` bloquant** (shift-left), versioning SemVer dérivé des commits, Release v0.78.0.

## 9. Usage de l'IA

L'IA (**Claude Code**) a servi de **binôme**, jamais en boîte noire : chaque proposition passe par le **filet TDD** (tests verts avant/après), les **gates CI** et la **revue humaine** (rapport d'étonnement). Trois cas, avec recul critique :

| Cas | Proposition IA | Notre décision (vérifiée) |
|---|---|---|
| **Complexité `_validate_params`** | extract method vers helpers nommés | **Accepté** — vérifié : radon CC 13 → 4 **et** 57 tests verts avant/après. |
| **Secret dev `S6698`** | marquer `NOSONAR` (suppression) | **Rejeté en partie** — la suppression masque sans corriger ; on a **retiré le mot de passe** de la source (vrai correctif). |
| **Remodelage backlog Jira** | classer ~160 tickets (livré / roadmap / obsolète) | **Accepté après vérification** — chaque classement recoupé avec le code (ex. `apps/worker` inexistant → ticket annulé). |

Principe (thèse du cours) : *« l'IA dit où regarder et propose ; le jugement d'ingénieur décide ; les tests + la CI prouvent »*.

## 10. Conclusion & plan d'amélioration priorisé

**Bilan** : projet **mature** — architecture découplée (DI/ports), **duplication 0,4 %**, **couverture ~95 %**, **0 bug**, maintenabilité **A**. L'audit a **corrigé 3 points** (sécurité, complexité, industrialisation) + **démontré** 2 dimensions déjà saines, le tout en **TDD** (verts avant/après), commits dédiés, sur `feature/STN-179`.

**Plan priorisé (impact / effort)** — *« Clean as You Code » : on durcit le nouveau code, la dette historique se résorbe au fil de l'eau* :

| Prio | Action | Impact | Effort | Ticket |
|---|---|---|---|---|
| 1 | Relire/marquer les **4 hotspots SonarCloud** (UI, justifiés) → Quality Gate verte | Élevé | Faible | STN-177 |
| 2 | Traiter les **vulnérabilités résiduelles** (`security_rating` E→A sur new code) | Élevé | Moyen | STN-178 |
| 3 | Passe **complexité cognitive** (SonarSource) sur les fichiers chauds | Moyen | Moyen | — |
| 4 | Étendre le **mutation testing** (mutmut/Stryker) aux slices métier | Moyen | Élevé | — |
| 5 | Hooks **pre-commit** (shift-left local) | Faible | Faible | STN-155 |

**Conclusion** : la maintenabilité de StackNest est **maîtrisée et outillée** (métriques, gates, TDD, Clean Archi) ; l'audit le **prouve chiffres à l'appui** et résorbe le peu de dette critique restante.
