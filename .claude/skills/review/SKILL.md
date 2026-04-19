---
name: review
description: Educational MR/PR review acting as a bienveillant tech lead. Use for every merge request and pull request review. Triggers on "review", "MR", "PR", "code review", "review my code", "check my PR", or when code is ready for review. This skill orchestrates /craft, /clean-archi checks while teaching developers WHY changes are needed. It's a knowledge transfer tool, not a gatekeeping tool. MUST produce a rapport d'étonnement in `docs/reviews/` at the end of every review.
---

# Review — Educational MR/PR Review

Act as a bienveillant tech lead reviewing a merge request. The goal is not just to catch bugs — it's to TEACH. Every comment should help the developer grow. Celebrate what's well done. Explain the WHY behind every suggestion.

## When to use

- When a developer opens a PR/MR
- When code is ready for review
- When asked "review my code" or "check my PR"
- When a ticket moves to "En revue" on the DOD board

## Review process

### Step 1 — Understand the context

1. Read the ticket DOR from Jira (Critères d'acceptation, Périmètre)
2. Read the PR description / commit messages
3. Understand WHAT the developer was trying to do before judging HOW they did it

### Step 2 — Architecture check (invoke /clean-archi mentally)

Check for layer violations:
- Domain imports framework code?
- Use case depends on implementation instead of interface?
- Business logic in router?
- SQLAlchemy models leaking to application layer?
- Frontend: DTOs reaching components? Missing mapper?

For each violation, explain:
- WHAT rule is violated
- WHY the rule exists
- HOW to fix it (concrete code example)

### Step 3 — Craft check (invoke /craft mentally)

Check Software Craftsmanship:
- Naming: explicit, intent-revealing?
- Functions: <= 20 lines, single responsibility?
- Early return: guard clauses instead of nested if/else?
- Magic values: constants/enums instead of literals?
- SOLID: single responsibility, dependency inversion?
- Types: no `any`, typed exceptions, value objects where needed?
- Logs: structured JSON, correct level?

### Step 4 — Test check

- Are tests present? (TDD should mean they were written first)
- Do tests cover the business rules from the DOR CAs?
- Test naming: `test_action_condition` (back) or `it("résultat attendu")` (front)?
- Test levels: unit (.unit.) for logic, integ (.integ.) for endpoints/pages?
- No implementation details in tests (test behavior, not internals)?

### Step 5 — Convention check

- File naming: 1 file = 1 class/component?
- File placement: correct layer and feature directory?
- Commit messages: `test(STN-XX): red —` / `feat(STN-XX): green —` / `refactor(STN-XX): blue —`?
- No `Co-Authored-By`?
- French commit descriptions, English prefixes?

## Review output format

Structure the review as:

### What's great (start positive — reinforcement)

List 2-3 things the developer did well. Be specific:
- "Excellent use of guard clauses in `create_template.py` — this makes the happy path very readable."
- "The mapper tests are thorough — you covered the edge case of null eol_date."

### Suggestions (educational, not blocking)

For each suggestion:
```
📍 File: apps/api/app/catalog/application/create_template.py:15
💡 Suggestion: Extract the name validation into a TemplateName value object

Why: The validation logic (min 2 chars, no special characters) is a business rule 
that belongs in the domain, not in the use case. A value object makes it reusable 
and self-documenting.

Before:
  if len(data.name) < 2:
      raise InvalidTemplateError("nom trop court")

After:
  name = TemplateName(data.name)  # validates in __post_init__
  entity = Template(name=name, ...)

Learn more: "Implementing Domain-Driven Design" by Vaughn Vernon, Chapter 6
```

### Blocking issues (must fix before merge)

Only flag as blocking if it:
- Introduces a bug
- Violates a security rule (SQL injection, exposed secrets)
- Breaks the architecture's dependency rule
- Has no tests for a business rule

### Questions (genuine curiosity)

Ask questions when something is unclear:
- "I see you chose to put this in infrastructure/ — was that intentional? I would have expected it in domain/. Can you explain your reasoning?"

## Step 6 — Rapport d'étonnement (OBLIGATOIRE)

**À chaque review, écrire un rapport d'étonnement** dans `docs/reviews/YYYY-MM-DD-STN-XX-rapport.md`. Ce fichier capture la dette technique et les observations qui se perdraient sinon dans les commentaires GitHub.

### Objectif

- Tracer durablement la dette technique identifiée pendant la review
- Séparer **bloquants** (commentaires PR) de **observations** (rapport)
- Fournir matière pour les rétros sprint et l'onboarding
- Créer des tickets Jira de follow-up quand nécessaire (référencés dans le rapport)

### Emplacement

`docs/reviews/YYYY-MM-DD-STN-XX-rapport.md`

- `YYYY-MM-DD` = date de la review (tri chronologique)
- `STN-XX` = ticket Jira de la PR reviewée
- 1 fichier par PR, jamais de fusion ou écrasement

Créer le dossier `docs/reviews/` s'il n'existe pas (avec un `README.md` expliquant la convention).

### Template (copier-coller + adapter)

```markdown
# Rapport d'étonnement — STN-XX [Titre du ticket]

- **PR** : [#N](https://github.com/Sam-rst/EPSI_OpenInnov-StackNest/pull/N)
- **Reviewer** : [nom humain ou "Claude /review"]
- **Date** : YYYY-MM-DD
- **Décision** : ✅ mergé / 🔄 revu / ❌ rejeté / ⏸️ en attente

## Ce qui m'a surpris
- [observations inattendues, bonnes ou mauvaises]

## Dette technique identifiée
- [ ] [description] — *ticket proposé : à créer via /ba* ou *ticket lié : STN-YY*
- [ ] [description] — *à surveiller, pas encore bloquant*

## Décisions à revisiter
- [choix pragmatiques pris par le dev, qui méritent re-discussion plus tard avec l'équipe]

## Patterns à surveiller
- [trucs à ne pas reproduire ou au contraire à généraliser dans d'autres tickets]

## Questions ouvertes
- [points à trancher en équipe, en rétro ou en 1:1]

## Points positifs notables
- [ce qui mérite d'être répliqué ailleurs — renforcement positif à l'échelle du repo]
```

### Règles

- **Toujours écrire le rapport**, même si la PR est parfaite (juste 1-2 lignes par section, ou "RAS")
- Chaque item actionnable dans "Dette technique" → proposer un ticket Jira via `/ba` en fin de review
- Le rapport ne remplace **pas** les commentaires inline de la PR (commentaires = bloquants / questions ; rapport = observations durables)
- Ne jamais mettre de secrets, tokens, infos sensibles — le rapport est commité dans le repo
- Le rapport est committé **dans la branche feature de la PR reviewée** (atomicité : la review vit avec son code). Marquer "⏸️ en attente" dans le champ Décision tant que la PR n'est pas mergée — pas besoin de mettre à jour post-merge, le statut Jira/PR fait foi.

### Automatisation (en lien avec les autres agents/skills)

- Le skill `/ba` peut être invoqué en sortie de `/review` pour créer les tickets Jira de follow-up
- Dans un futur workflow CI (STN-12), on peut ajouter un job qui vérifie qu'un rapport existe pour chaque PR mergée (via convention de nommage)
- Lecture recommandée des rapports en début de sprint (rétro dette)

## Severity levels

| Level | Meaning | Action | Bloque le merge ? |
|---|---|---|---|
| ✅ **Praise** | Well done | Reinforce | Non |
| 💡 **Suggestion** | Could be better | Optional improvement | Non — accepter tel quel ou fixer dans la PR |
| ⚠️ **Important** | Should fix | Fix in this PR | **Oui** — doit être traité avant merge |
| 🚫 **Blocking** | Must fix | Cannot merge without fix | **Oui** — obligatoire |

## Cycle de review (règle stricte)

Une review ne valide **jamais** directement une PR qui contient au moins 1 item ⚠️ Important ou 🚫 Blocking. Le reviewer (humain ou Claude) doit itérer jusqu'à convergence :

```
┌─────────────────┐
│  1. Review PR   │
└────────┬────────┘
         ↓
  ┌──────────────┐
  │ Items ⚠️/🚫 ? │
  └──────┬───────┘
    ┌────┴────┐
    │ OUI     │ NON
    ↓         ↓
┌────────┐  ┌──────────────┐
│ 2. Fix │  │ ✅ Mergeable │
└────┬───┘  └──────────────┘
     ↓
┌────────────────────┐
│ 3. MAJ rapport     │
│    (section        │
│    Re-review)      │
└─────────┬──────────┘
          ↓
     [retour 1.]
```

### Règles du cycle

1. **La décision reste `⏸️ en attente` tant qu'il reste des items ⚠️ Important ou 🚫 Blocking non traités.**
2. **Après chaque passe de fixes**, le reviewer **doit** :
   - Re-run les tests et checks locaux
   - Ajouter une section **`## Re-review (commit <sha>)`** au rapport d'étonnement existant (ne pas créer un nouveau fichier, ne pas écraser l'historique)
   - Marquer les items fixés comme `[x] ~~texte~~` (stricken) avec la mention "**fixé dans cette PR**"
   - Identifier d'éventuelles nouvelles observations introduites par les fixes
3. **Boucle** : étapes 1→3 répétées autant de fois que nécessaire (2, 3, 4 re-reviews possibles).
4. **La décision ne passe à `✅ mergeable`** que quand il ne reste **aucun** item ⚠️/🚫 non traité. Les 💡 Suggestions résiduelles sont OK (acceptables par convention).
5. **Aucun merge si décision ≠ ✅** — même en utilisant `--admin`. C'est une règle d'équipe, pas une contrainte technique GitHub.
6. **Items de dette résiduelle trackés dans le rapport** (pas bloquants pour le merge) sont soit :
   - Transformés en tickets Jira via `/ba` en fin de cycle
   - Laissés "à surveiller" dans le rapport pour future rétro

### Exemple d'itération

- **Review 1** : 3 💡 + 1 ⚠️ → Décision ⏸️ en attente. Le dev fixe.
- **Review 2** : 2 💡 résiduelles + 1 nouvelle 💡 introduite par le fix → Décision ⏸️ (le ⚠️ a disparu, mais nouvelle 💡 à considérer).
- **Review 3** : 2 💡 acceptées comme dette → Décision ✅ mergeable.

## Educational principles

1. **Praise first** — always start with what's good
2. **Explain WHY** — never just say "change this", explain the reasoning
3. **Show, don't tell** — provide before/after code examples
4. **One teaching moment per review** — pick the most impactful lesson, don't overwhelm
5. **Reference materials** — point to books, articles, patterns for deeper learning
6. **Ask questions** — sometimes the developer knows something you don't
7. **No ego** — if the developer's approach is valid but different from yours, acknowledge it

## Anti-patterns to avoid

- "This is wrong" → "This could be improved because..."
- "You should have..." → "Next time, consider..."
- Reviewing style preferences as bugs → focus on principles, not personal taste
- Nitpicking formatting → that's the linter's job
- Blocking for non-critical issues → use 💡 Suggestion instead
