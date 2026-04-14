---
name: ba
description: Generate Jira tickets with full DOR (Definition of Ready) for StackNest. Use this skill whenever the user asks to create a ticket, write a ticket, generate a Jira issue, draft a story/task/bug, or mentions DOR/Definition of Ready. Also trigger when the user says "ticket for X", "create an issue for X", "write the Jira for X", or discusses breaking down work into Jira stories. This skill ensures every ticket follows the team's 6-section DOR template with Given/When/Then acceptance criteria.
---

# BA — Jira Ticket Generator (DOR)

Generate Jira tickets that respect the team's Definition of Ready. Every ticket must be complete enough to be developed without ambiguity.

## When to use

- User asks to create/write/draft a Jira ticket, story, task, or bug
- User wants to break down a feature into tickets
- User mentions DOR or Definition of Ready
- User says "ticket for X" or "issue for X"

## Process

1. **Understand the scope** — read the spec document at `docs/superpowers/specs/2026-04-14-stacknest-architecture-design.md` to understand the project architecture, tech stack, and existing ticket list
2. **Clarify if needed** — ask the user ONE question at a time if the scope is ambiguous
3. **Generate the ticket** — follow the DOR template exactly
4. **Present for review** — show the ticket to the user before any Jira action

## DOR Template (6 mandatory sections)

Every ticket description MUST contain these 6 sections in this exact order:

```markdown
## Contexte

[Description du besoin, pourquoi ce ticket existe, quel probleme il resout]

---

## Criteres d'acceptation

Minimum 3 criteres, format Given/When/Then :

### CA1 — [Titre]

> **Etant donne** [contexte initial]
> **Quand** [action ou evenement]
> **Alors** [resultat attendu]

### CA2 — [Titre]

> **Etant donne** ...
> **Quand** ...
> **Alors** ...

### CA3 — [Titre]

> **Etant donne** ...
> **Quand** ...
> **Alors** ...

---

## Parcours utilisateur

### Parcours principal

1. L'utilisateur fait X
2. Le systeme affiche Y
3. L'utilisateur clique sur Z
4. Le systeme repond avec W

### Parcours alternatifs

- Si [condition] -> [comportement alternatif]
- Si [erreur] -> [message d'erreur ou fallback]

---

## Perimetre

### Inclus

**Backend :**
- Feature `api/app/xxx/` (domain, application, infrastructure, presentation)
- Modeles BDD : tables `xxx`, `yyy`
- Endpoints REST : `GET /xxx`, `POST /xxx`
- Tests unitaires, integration et E2E

**Frontend :**
- Feature `ui/src/xxx/` (components, pages, services, hooks, types)
- Ecran principal avec composants X, Y, Z

### Hors perimetre

- [Feature future non incluse]
- [Amelioration reportee]

---

## Impact technique

**Base de donnees :**
- Nouvelles tables : `table_a` (champs...), `table_b` (champs...)
- Index, migrations, seed

**Backend :**
- Nouveau module feature-sliced dans `api/app/`
- Nouveaux endpoints / events
- Algorithmes ou logique metier

**Frontend :**
- Nouveaux composants dans `ui/src/`
- Navigation mise a jour

**Performance :**
- [Considerations si pertinent]

---

## Risques et dependances

**Dependances :**
- **EOS-XX (Titre)** — Bloquant. [Explication]
- **Maquette Figma** — Necessaire avant le dev frontend

**Risques :**
- **[Risque]** — [Description]. Mitigation : [solution]

---

## Scenarios de test

**Tests unitaires :**
- service-a : [description du test]
- service-b : [description du test]

**Tests d'integration :**
- GET /endpoint retourne [attendu] pour [contexte]
- POST /endpoint avec [input] retourne [code]

**Tests E2E :**
- Scenario complet : [flow de bout en bout]

**Tests frontend :**
- L'ecran affiche [composant] avec [donnees]
- Le bouton [action] est [etat] quand [condition]
```

## Jira fields to specify

For each ticket, also specify these fields outside the description:

| Champ | Valeur |
|-------|--------|
| **Titre** | Court et explicite, prefixe par le domaine : `[Store] Titre`, `[Auth] Titre`, etc. |
| **Type** | Story / Bug / Task |
| **Priorite** | Highest / High / Medium / Low / Lowest |
| **Story Points** | Fibonacci : 1, 2, 3, 5, 8, 13 |
| **Epic** | `[Store] Catalogue de services`, `[Auth] Gestion des utilisateurs et RBAC`, `[Infra] Automation Engine Terraform`, `[ChatOps] Assistant IA conversationnel`, `[Dashboard] Vue des ressources et couts`, `[Security] Securisation et conformite`, `[DevOps] CI/CD et conteneurisation`, `[Docs] Documentation utilisateur` |
| **Fix Version** | v0.1.0 (Store+auth), v0.2.0 (Terraform runner), v0.3.0 (Chatbot IA), v0.4.0 (Dashboard+finitions), v1.0.0 (release) |
| **Labels** | Domaine : `backend`, `frontend`, `infra`, `database`, `security`, `ia`. Nature : `tech-debt`, `ux`, `performance`, `documentation`, `design`. Contexte : `quick-win`, `spike`, `bloquant` |

## Architecture references

When writing the Perimetre and Impact technique sections, use the project's actual architecture:

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

**BDD :** PostgreSQL, migrations Alembic, UUIDs partout

## Rules

- Minimum 3 criteres d'acceptation par ticket (Given/When/Then in French: Etant donne/Quand/Alors)
- Parcours principal + alternatifs (happy path + erreurs)
- Perimetre : toujours separer backend/frontend/BDD + lister le hors perimetre
- Impact technique : noms de tables, endpoints, composants concrets — pas de vague
- Chaque risque a sa mitigation
- Tests : couvrir unitaire, integration, E2E, frontend
- DOR obligatoire meme pour les bugfixes — adapter la taille au ticket
- Commits en francais, references Jira (EOS-XX)
- Story Points obligatoires

## Batch mode

When the user asks to generate multiple tickets at once (e.g., "generate all tickets for the Auth epic"), generate each ticket fully with its DOR, separated by `---`. Present them all for review before any Jira action.

## Output format

Present the ticket as a clean markdown block that can be copy-pasted directly into Jira's description field. Show the Jira fields (title, type, priority, story points, epic, version, labels) in a summary table above the description.
