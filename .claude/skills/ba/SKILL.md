---
name: ba
description: Generate Jira tickets with full DOR (Definition of Ready). Use when creating any ticket (feature, bug, task), writing specs, or breaking down work. This skill orchestrates the full ticket lifecycle from creation to "Prêt" — including brainstorming, design, spec writing, dependency linking, and estimation. ALWAYS invoke this skill before creating any Jira ticket. Triggers on "ticket for X", "create an issue", "write the Jira for X", "new feature", "new bug", "DOR", or any discussion about breaking down work into stories.
---

# BA — Jira Ticket Orchestrator (DOR)

Orchestrates the full lifecycle of a Jira ticket from idea to "Prêt". The BA does NOT write specs alone — it drives a structured process that includes brainstorming, optional design, and collaborative spec writing.

## When to use

- User wants to create a new ticket (feature, bug, task)
- User wants to break down a feature into tickets
- User mentions DOR, spec, or ticket creation
- User says "ticket for X", "issue for X", "new feature", "new bug"

## Workflow (13 steps)

Follow these steps IN ORDER. Do not skip steps. Each step requires user validation before proceeding.

```
Step 1: Ticket creation (skeleton)
  ↓
Step 2: Transition to Backlog
  ↓
Step 3: Transition to A spécifier → start brainstorming
  ↓
Step 4: Invoke brainstorming skill
  ↓
Step 5: Brainstorm with the user (BA listens and takes notes)
  ↓
Step 6: Validate scope (inclus/hors périmètre) with user
  ↓
Step 7: (Optional) Invoke designer if UI/UX is needed
  ↓
Step 8: Write the full DOR in the ticket description
  ↓
Step 9: Link dependencies between tickets
  ↓
Step 9b: Identify and document risks with mitigations
  ↓
Step 10: Transition to A estimer
  ↓
Step 11: Estimate with the complexity matrix
  ↓
Step 12: User validates the complete ticket → manually transitions to Prêt
```

### Step 1 — Create ticket skeleton

Create the ticket on Jira with:
- Title (prefixed by domain: `[Store]`, `[Auth]`, `[Infra]`, etc.)
- Type (Story / Bug / Task)
- Priority
- Epic link
- Fix Version
- Labels
- Description: only the Contexte section (brief summary of the need)

The description is intentionally incomplete at this stage — full DOR comes after brainstorming.

### Step 2 — Transition to Backlog

Move the ticket: Nouveau → Backlog (transition "Trier")

### Step 3 — Transition to A spécifier

Move the ticket: Backlog → A spécifier (transition "Prendre en charge")

This signals the start of the specification process.

### Step 4 — Invoke brainstorming

Call the `superpowers:brainstorming` skill to explore the need with the user. The BA provides context from the spec document and existing tickets.

Before invoking, read:
- `docs/superpowers/specs/2026-04-14-stacknest-architecture-design.md` (project architecture)
- The existing tickets in the same epic (to understand what's already planned)

### Step 5 — Brainstorm

The brainstorming skill drives the conversation. The BA listens and takes structured notes on:
- The problem being solved
- The proposed solution
- Technical approach
- Edge cases and error handling
- Acceptance criteria (Given/When/Then)
- What's in scope vs out of scope

### Step 6 — Validate scope

After brainstorming, the BA presents a summary:
- **Inclus** : what this ticket covers (backend, frontend, BDD)
- **Hors périmètre** : what is explicitly NOT included

The user must validate before proceeding to writing the DOR.

### Step 7 — Optional: Design

If the ticket involves UI/UX (new pages, complex interactions, multi-state flows), invoke the designer:
- If the user has a Figma license → use `figma:figma-generate-design` or `figma:figma-implement-design`
- If not → use `frontend-design` skill to produce mockups/wireframes
- The designer works alongside the brainstormer to find a solution that matches the need

Skip this step if the ticket is backend-only or infra.

### Step 8 — Write the full DOR

Update the ticket description on Jira with the complete DOR (6 sections). Use ADF format with styled panels (see styling rules below).

The DOR must include ALL information gathered during brainstorming and design steps.

### Step 9 — Link dependencies

Search existing tickets and create issue links:
- **Blocks**: ticket A must be completed before ticket B can start
- **Relates**: tickets are related but not blocking

Dependencies must also appear in the DOR section "Risques et dépendances".

### Step 9b — Identify risks

For each risk identified during brainstorming:
- Document the risk clearly
- Propose a mitigation
- Flag blocking dependencies with other teams (cyber, B1)

### Step 10 — Transition to A estimer

Move the ticket: A spécifier → A estimer (transition "Spec terminée")

### Step 11 — Estimate with complexity matrix

Apply the matrix, show the filled table to the user:

| Critere | 1 – Simple | 3 – Moyen | 5 – Complexe | 8 – Tres complexe |
|---|---|---|---|---|
| Effort technique | Modification triviale | Developpement standard | Logique non triviale | Refonte d'architecture |
| Inconnues / risque | Tout est clair | Quelques points a clarifier | Comportement flou | Territoire inconnu, R&D |
| Dependances | Aucune | 1 module interne | Plusieurs modules/equipes | Dependances externes critiques |
| Impact metier | Fonctionnalite isolee | Un seul domaine | Plusieurs domaines | Transverse au produit |
| Tests necessaires | Unitaire simple | Integration standards | Scenarios multiples / edge cases | E2E + non-regression lourde |
| UX / Design | Aucune interface | UI existante a adapter | Nouvelle interface | Parcours complexe multi-etats |

**Rules:**
1. Evaluate each criterion and briefly justify the score
2. Calculate the average of the 6 scores
3. Round to the nearest Fibonacci number (1, 2, 3, 5, 8, 13, 21)
4. If any single criterion exceeds 8, propose to split the ticket

Update the Story Points field on Jira and add the matrix to the ticket description.

### Step 12 — User validates

Present the complete ticket to the user for final review. The user validates and manually transitions the ticket to "Prêt" (transition "DOR validée").

The BA does NOT transition to Prêt — only the user does, confirming the DOR is complete.

### Step 13 — Add to sprint

Once in "Prêt", suggest adding the ticket to the current sprint on the DOD board.

---

## DOR Template (6 mandatory sections)

Every ticket description MUST contain these 6 sections in this exact order:

### 📋 Contexte
[Description du besoin, pourquoi ce ticket existe, quel probleme il resout]

### ✅ Critères d'acceptation
Minimum 3 criteres, format Given/When/Then :
- CA1, CA2, CA3... each in its own success panel

### 🚶 Parcours utilisateur
- Parcours principal (ordered list)
- Parcours alternatifs (warning panel)

### 📦 Périmètre
- Inclus (backend, frontend, BDD with bullet lists)
- Hors périmètre (explicit exclusions)

### 💥 Impact technique
- Base de données, Backend, Frontend, Performance

### ⚠️ Risques et dépendances
- Dépendances (bloquantes avec ticket IDs)
- Risques (chacun avec sa mitigation)

### 🧪 Scénarios de test
- Tests unitaires, intégration, E2E, frontend

### 🎯 Matrice de complexité
- Table with 6 criteria, scores, justifications, and final SP

---

## Jira fields

| Champ | Valeur |
|---|---|
| **Titre** | Court et explicite, prefixe domaine : `[Store]`, `[Auth]`, `[Infra]`, `[ChatOps]`, `[Dashboard]`, `[Docs]`, `[DevOps]`, `[Security]` |
| **Type** | Story / Bug / Tâche |
| **Priorite** | Highest / High / Medium / Low / Lowest |
| **Story Points** | Fibonacci : 1, 2, 3, 5, 8, 13, 21 |
| **Epic** | STN-1 Store, STN-2 Auth, STN-3 Infra, STN-4 ChatOps, STN-5 Dashboard, STN-6 Docs, STN-7 DevOps, STN-8 Security |
| **Fix Version** | v0.1.0 to v0.9.0 |
| **Labels** | Domaine: `backend`, `frontend`, `infra`, `database`, `security`, `ia`. Nature: `tech-debt`, `ux`, `performance`, `documentation`, `design`. Contexte: `quick-win`, `spike`, `bloquant` |

---

## Architecture references

**Backend (FastAPI + Clean Archi vertical slicing) :**
- `api/app/{feature}/domain/` — entites, interfaces
- `api/app/{feature}/application/` — use cases
- `api/app/{feature}/infrastructure/` — repos, connecteurs externes
- `api/app/{feature}/presentation/` — routes FastAPI

**Frontend (React + Vite + TypeScript vertical slicing) :**
- `ui/src/{feature}/components/` — composants React
- `ui/src/{feature}/pages/` — pages/ecrans
- `ui/src/{feature}/services/` — appels API
- `ui/src/{feature}/hooks/` — hooks custom
- `ui/src/{feature}/types/` — DTOs TypeScript

**BDD :** PostgreSQL 16, SQLAlchemy async, migrations Alembic, UUIDs partout

---

## Jira styling rules (ADF format)

When creating or editing tickets on Jira via the MCP API, ALWAYS use `contentFormat: "adf"` with colored panels.

**Panel mapping:**

| Section | Panel type | Color |
|---|---|---|
| Contexte | `info` | Blue |
| Critères d'acceptation (each CA) | `success` | Green |
| Parcours alternatifs | `warning` | Yellow |
| Impact technique | `note` | Purple |
| Risques et dépendances | `warning` | Yellow |
| Scénarios de test | `info` | Blue |

**Sections WITHOUT panels:**
- Parcours principal → ordered list
- Périmètre → bullet lists with emojis (🔧 Backend, 📖 Documentation, ❌ Hors périmètre)
- Matrice de complexité → ADF table

**Emojis on H2 titles:**
📋 Contexte, ✅ Critères d'acceptation, 🚶 Parcours utilisateur, 📦 Périmètre, 💥 Impact technique, ⚠️ Risques et dépendances, 🧪 Scénarios de test, 🎯 Matrice de complexité

**Separators:** `rule` (horizontal line) between each H2 section.

---

## Dependency linking rules

When creating tickets on Jira, ALWAYS create issue links for dependencies:
- **Blocks**: ticket A must be completed before ticket B. Blocker = `inwardIssue`, blocked = `outwardIssue`.
- **Relates**: tickets related but not blocking.
- Dependencies must appear in DOR AND be linked on Jira.
- Search existing tickets to identify cross-version dependencies.

---

## Rules

- NEVER skip the brainstorming step — the DOR quality depends on it
- Minimum 3 critères d'acceptation per ticket (Given/When/Then in French)
- Parcours principal + alternatifs (happy path + errors)
- Périmètre: always separate backend/frontend/BDD + list what's excluded
- Impact technique: concrete table names, endpoints, components — no vague descriptions
- Every risk has a mitigation
- Tests: cover unit, integration, E2E, frontend
- DOR is mandatory even for bugfixes — adapt the depth to the ticket size
- Story Points are mandatory
- The BA does NOT transition to Prêt — only the user does after validating

## Batch mode

When the user asks to generate multiple tickets at once, follow the full workflow for each ticket but batch the brainstorming phase — discuss all tickets first, then write the DORs.
