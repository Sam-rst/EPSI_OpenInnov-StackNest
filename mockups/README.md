# Mockups StackNest

Espace exploratoire pour les maquettes UI. **Cette branche n'est jamais mergée vers `main`.**

## Convention

```
mockups/
├── STN-<ticket-id>/           # ticket Story Jira (ou Epic si Story pas encore créé)
│   └── <page-slug>/           # page ou composant visé
│       ├── v1-<skill-court>.html
│       ├── v2-<skill-court>.html
│       └── ...
└── README.md
```

Exemple : [STN-15/catalog/v2-frontend-design.html](STN-15/catalog/v2-frontend-design.html) (page `/catalog`, ticket Story STN-15)

## Convention de commit

```
design(STN-XX): vN — <description courte>
```

## Format des fichiers

HTML standalone, ouvrables au double-clic :

- Tailwind via CDN (`cdn.tailwindcss.com`)
- React 18 via `esm.sh`
- Framer Motion via `esm.sh`
- Babel standalone pour transformer le JSX

Aucun `npm install`, aucun build. Les maquettes sont jetables — quand le ticket passe en developpement, on transpose manuellement vers `apps/web/` en respectant la Clean Archi (DTO/Model/Mapper, compound components, etc.).

## Skill retenu

**`frontend-design:frontend-design`** (plugin officiel Anthropic) pour toute nouvelle maquette. Philosophie : aesthétique assumée, on-brand, éviter le "AI slop" générique. Voir la comparaison dans [STN-15/catalog/](STN-15/catalog/) (v1 vs v2).

## Charte imposée

| | |
|---|---|
| Bleu nuit | `#032233` |
| Cyan | `#0d9297` |
| Jaune | `#fea21f` |
| Fonts | Inter + JetBrains Mono |
| Langue UI | 100% français |
