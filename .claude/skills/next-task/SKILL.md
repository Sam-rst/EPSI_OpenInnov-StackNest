---
name: next-task
description: Identifies the next Jira ticket to work on in the current Claude Code session. Queries Jira for tickets in status "Prêt" (or "A estimer" as fallback), filters out blocked tickets and tickets waiting for mockups, respects blocker dependencies, and proposes the optimal ticket to pick. ALWAYS invoke at session start when working on StackNest, or whenever the user asks "what's next", "prochain ticket", "qu'est-ce que je fais maintenant", "session start", "what to work on".
---

# /next-task — Identify the next ticket to work on

Ce skill s'invoque au démarrage de toute nouvelle session Claude Code sur StackNest (notamment dans un clone fraîchement créé), ou à chaque fois que l'utilisateur termine un ticket et cherche le suivant.

## Quand l'utiliser

- L'utilisateur ouvre une nouvelle session Claude Code dans le repo StackNest.
- L'utilisateur a terminé un ticket et demande "qu'est-ce que je fais maintenant ?".
- L'utilisateur dit "prochain ticket", "next task", "what's next", "session start".
- Après un `git checkout main` + `git pull`, pour identifier ce qui est à traiter.

## Protocole (6 étapes)

### Étape 1 — Vérifier l'état local

Avant d'interroger Jira, vérifier le contexte local :
- Branche git courante : `git rev-parse --abbrev-ref HEAD`
- État working tree : `git status --short`
- Si working tree sale → signaler à l'utilisateur, proposer stash ou commit.
- Si branche = `feature/STN-XX-*` → l'utilisateur est déjà en train de bosser sur ce ticket. Proposer de continuer plutôt que chercher un nouveau ticket.

### Étape 2 — Interroger Jira via JQL

Utiliser le MCP Atlassian (`mcp__plugin_atlassian_atlassian__searchJiraIssuesUsingJql`) avec `cloudId="samrst-studies.atlassian.net"`.

**Requête principale — tickets Prêt éligibles :**

```jql
project = STN
  AND status = "Prêt"
  AND (labels IS EMPTY OR labels NOT IN ("attente-maquette"))
  AND fixVersion IN unreleasedVersions()
ORDER BY priority DESC, "Story Points" ASC, created ASC
```

**Fallback si aucun ticket Prêt — tickets "A estimer" :**

```jql
project = STN
  AND status = "A estimer"
  AND (labels IS EMPTY OR labels NOT IN ("attente-maquette"))
  AND fixVersion IN unreleasedVersions()
ORDER BY priority DESC, created ASC
```

**Fallback ultime — tickets "A spécifier" :**

```jql
project = STN
  AND status = "A spécifier"
  AND fixVersion IN unreleasedVersions()
ORDER BY priority DESC, created ASC
```

Limiter à `maxResults: 20`.

### Étape 3 — Filtrer et prioriser

Pour chaque ticket retourné, vérifier :

1. **Dépendances bloquantes** : si le ticket a des `issuelinks` de type "Blocks" (inward = "is blocked by"), fetcher les tickets bloquants et vérifier qu'ils sont en statut `Terminé` ou `En recette` (ou au minimum `En QA`). Si un bloquant n'est pas terminé → skip ce ticket.

2. **Label `attente-maquette`** : skip (devrait déjà être filtré par JQL, vérifier par sécurité).

3. **Sprint actif** : préférer les tickets dans le sprint actif en cours (custom field `customfield_10020` contient le sprint).

4. **Charge de travail** : préférer les tickets de priorité `Highest` ou `High`, puis par Story Points croissant (démarrer par les plus simples si plusieurs de même priorité).

### Étape 4 — Proposer le meilleur ticket

Présenter à l'utilisateur **1 seul ticket recommandé** (pas une liste) avec ce format :

```
## 🎯 Prochain ticket : [STN-XX] Titre

- **Priorité** : High · **Story Points** : 2 · **Fix Version** : v0.1.0
- **Epic parent** : STN-X [Core] UI Shell & Layout
- **Labels** : frontend, ux
- **Lien** : https://samrst-studies.atlassian.net/browse/STN-XX

### Pourquoi celui-ci ?
- Priorité la plus haute parmi les tickets Prêt
- Tous les prérequis sont terminés (STN-YY ✓, STN-ZZ ✓)
- Scope bien défini, DOR complet, pas de maquette en attente

### Résumé (Contexte + 1 CA principal)
[3-4 lignes max]

### Commandes pour démarrer
\`\`\`bash
git checkout main && git pull
git checkout -b feature/STN-XX-slug-court
\`\`\`

Puis j'invoque le skill `/TDD` pour attaquer en Red → Green → Blue.
```

Ensuite **attendre la validation user** avant de créer la branche ou de coder.

### Étape 5 — Cas limites

**Aucun ticket Prêt disponible :**
- Si tous les tickets Prêt ont des labels `attente-maquette` → proposer à l'utilisateur de travailler sur les maquettes manquantes (lister les tickets avec ce label) ou de continuer à spec des tickets en `A spécifier`.
- Si aucun ticket dans aucun statut → proposer d'ouvrir le board Jira pour vérifier manuellement : https://samrst-studies.atlassian.net/jira/software/projects/STN/boards/34

**Tous les tickets Prêt ont des dépendances non terminées :**
- Lister les bloquants qui manquent → proposer de travailler sur un des bloquants en priorité.

**L'utilisateur préfère un autre ticket :**
- Respecter son choix. Si le ticket choisi a des bloquants non terminés → signaler mais laisser faire.

### Étape 6 — Mémoire (optionnel)

Si l'utilisateur valide le ticket proposé, sauvegarder dans la mémoire session :
- `currentTicket: STN-XX`
- `currentBranch: feature/STN-XX-slug`

Ça permettra au prochain `/next-task` d'ignorer ce ticket (car déjà en cours).

## Règles

- **NE JAMAIS** créer la branche ou commencer à coder sans validation user explicite.
- **NE JAMAIS** proposer un ticket `Bloqué` ou `En attente de maquette`.
- **TOUJOURS** respecter l'ordre `Highest > High > Medium > Low > Lowest` (mapping MoSCoW).
- **TOUJOURS** vérifier les dépendances bloquantes avant de proposer.
- Si ambiguïté ou plusieurs candidats de même priorité → présenter top 3 et laisser l'user choisir.

## Après que le ticket est pris

1. L'utilisateur transitionne manuellement le ticket `Prêt` → `En développement` sur Jira (ou demande à Claude de le faire via `mcp__plugin_atlassian_atlassian__transitionJiraIssue`).
2. Invoquer le skill `/TDD` pour attaquer le ticket en TDD strict.
3. À chaque fin de phase Red / Green / Blue : commit avec message `test(STN-XX): red — ...` / `feat(STN-XX): green — ...` / `refactor(STN-XX): blue — ...`.
4. Fin de ticket : créer la PR vers `main`, demander review.

## Exemple d'exécution

```
User: /next-task

Claude:
[Vérifie git state]
✓ Branche : main, working tree propre.

[Query JQL Prêt]
→ 3 tickets trouvés : STN-11 (2 SP, High), STN-13 (2 SP, High), STN-14 (4 SP, High)

[Vérifie dépendances]
- STN-11 : 0 bloquant ✓
- STN-13 : 0 bloquant ✓
- STN-14 : bloqué par STN-11 + STN-13 (à faire d'abord)

## 🎯 Prochain ticket : [STN-11] [DevOps] Docker Compose dev + override

- Priorité : Highest · SP : 2 · Fix Version : v0.1.0
- Aucun bloquant, démarrable immédiatement
- Scope : setup docker-compose.yml + .dev.yml + services db/redis

Commandes :
git checkout -b feature/STN-11-docker-compose-dev

Je prépare le skill /TDD ou tu veux attaquer autrement ?
```
