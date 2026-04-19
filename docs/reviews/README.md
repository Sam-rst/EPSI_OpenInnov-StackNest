# Rapports d'étonnement — Reviews PR

Ce dossier contient un **rapport d'étonnement par PR** générés pendant la code review. Objectif : tracer durablement la dette technique, les observations et les décisions pragmatiques qui seraient perdues dans les commentaires GitHub.

## Convention de nommage

```
docs/reviews/YYYY-MM-DD-STN-XX-rapport.md
```

- `YYYY-MM-DD` : date de la review (tri chronologique)
- `STN-XX` : ticket Jira de la PR
- 1 fichier par PR, jamais de fusion ou d'écrasement

## Quand rédiger un rapport ?

À chaque invocation du skill `/review` (humain ou Claude) — même si la PR est parfaite (RAS suffit). C'est une règle stricte pour ne jamais oublier la dette.

## Structure obligatoire

Cf. skill `/review` étape 6 pour le template complet. Les 6 sections :

1. **Ce qui m'a surpris** — observations inattendues
2. **Dette technique identifiée** — items actionnables, avec proposition de ticket Jira
3. **Décisions à revisiter** — choix pragmatiques à rediscuter
4. **Patterns à surveiller** — à répliquer ou à éviter
5. **Questions ouvertes** — à trancher en équipe / rétro
6. **Points positifs notables** — renforcement positif à l'échelle du repo

## Règles

- **Pas de secrets** dans les rapports (tokens, credentials, infos sensibles) — commité dans le repo public
- **Commit dans la branche feature de la PR reviewée** (atomicité : review livrée avec son code). Statut "⏸️ en attente" tant que non mergé, pas besoin d'update post-merge.
- **Chaque item "Dette technique"** actionnable doit déclencher la création d'un ticket Jira via `/ba` (référencé dans le rapport)
- **Relecture en début de sprint** : point dédié en rétro pour traiter la dette accumulée

## Exemple

```
docs/reviews/
├── README.md                            ← ce fichier
├── 2026-04-19-STN-28-rapport.md
├── 2026-04-22-STN-29-rapport.md
└── ...
```

## Lien avec les autres skills

- `/review` — génère le rapport (étape 6 obligatoire)
- `/ba` — crée les tickets Jira de follow-up (items "Dette technique")
- `/next-task` — peut proposer en priorité les tickets créés depuis un rapport si tagués `dette-technique`
