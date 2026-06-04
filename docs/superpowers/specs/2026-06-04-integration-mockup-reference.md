# Intégration du mockup frontend comme référence design — Spec technique (STN-157)

> Intégrer le travail front prototypé par Yassine (branche `mockups`) dans `main` **comme
> référence de design vivante**, sans impacter `apps/web` ni le quality gate. Le mockup est copié
> **tel quel** dans `apps/web-mockup/`, reste hors CI par construction, et sert de support visuel
> pour redévelopper chaque feature proprement en TDD strict dans `apps/web`.
>
> Ticket : [STN-157](https://samrst-studies.atlassian.net/browse/STN-157) — Tâche DevOps, 2 SP.
> Lié (Relates) à STN-156 (convention worktree) dont le workflow parallèle a servi à livrer ce ticket.

---

## 1. Problème

Yassine a livré 8 écrans front excellents en UX/UI sur la branche `mockups`, mais **hors workflow** :
aucun test, fichiers parfois > 150 lignes, pas de DTO/Model/Mapper, pas de Clean Archi, pas de commits
TDD. Ce code n'est **pas mergeable** dans `apps/web/` (le front de production, React 19 / Tailwind 4 /
Vite + TS strict, sous quality gate). Mais le perdre serait gâcher une excellente base de design.

Besoin : conserver ce travail **accessible et lançable** dans `main`, comme référence visuelle, sans :
- polluer `apps/web` (qui doit rester 100 % pur, sous quality gate strict) ;
- faire échouer la CI (le mockup ne respecte ni lint strict, ni typecheck, ni tests) ;
- imposer une migration (React 18→19, Tailwind 3→4, Vite 5→8) coûteuse et hors sujet.

---

## 2. Décisions de design (validées)

| Sujet | Décision | Justification |
| --- | --- | --- |
| Emplacement | Copier `mockups:apps/web` → **`apps/web-mockup/`** | App front sœur, isolée d'`apps/web`, nom explicite |
| Fidélité | Copie **AS-IS**, aucune migration | C'est une archive de design, pas du code à faire évoluer |
| Méthode de copie | `git read-tree --prefix=apps/web-mockup/ -u mockups:apps/web` | Copie l'arbre exact depuis la branche `mockups` **sans jamais toucher `apps/web`** (garantit CA4) |
| Quality gate | **Hors CI par construction** | Pas de `package.json` racine (pas de workspaces) ; lanes CI ciblent `apps/web` ; Sonar exclut `apps/web-mockup/**` |
| Documentation exclusion | CI (`ci.yml`), Sonar (`sonar-project.properties`), `CLAUDE.md` | Intention explicite et découvrable, défend contre un rattachement accidentel futur |
| Charte graphique | PDF déplacé à la **racine de `docs/`** | Doc projet, pas un artefact racine |
| Branche `mockups` | **Conservée** comme archive d'origine | Traçabilité ; on n'écrase pas l'historique du prototype |
| Évolution future | Chaque feature redéveloppée dans `apps/web` en **TDD strict** | `apps/web-mockup` ne reçoit plus de commits fonctionnels |

---

## 3. Contenu copié

- **216 fichiers** trackés depuis `mockups:apps/web` (aucun `node_modules/` ni `dist/` n'est tracké
  côté `mockups`, donc rien de superflu n'est copié).
- Stack du mockup : **React 18.3.1 / react-dom 18.3.1 / Tailwind 3.4.13 / Vite 5.4.8 / TypeScript 5.6.2**,
  `@tanstack/react-query` 5, `framer-motion` 11, `lucide-react`, `react-hook-form` 7, `react-router-dom` 6, `zod` 3.
- `apps/web-mockup/.gitignore` est copié avec le reste → `node_modules/` et `dist/` du mockup sont
  ignorés localement (aucun risque de commit accidentel après `npm install`).
- **Charte** : `StackNest — Charte graphique.pdf` (2 178 853 octets) copiée depuis la racine de
  `mockups` vers `docs/` (intégrité binaire vérifiée par taille).

---

## 4. Hors CI / quality gate — preuve par construction

| Mécanisme | Pourquoi `apps/web-mockup` est exclu |
| --- | --- |
| Pas de workspaces | Aucun `package.json` à la racine du dépôt → aucun outil racine ne traverse `apps/web-mockup` |
| Lanes CI (`ci.yml`) | `lint/format/typecheck/test/build-web` utilisent `working-directory: apps/web` / `context: apps/web` ; semgrep scanne `apps/web`. Aucun job ne référence `apps/web-mockup` |
| Sonar (`sonar-project.properties`) | `sonar.sources=apps/api/app,apps/web/src` ; on ajoute en plus `sonar.exclusions=apps/web-mockup/**` (explicite) |
| Docker | `build-stack` ne construit que les images `apps/api` et `apps/web` ; le mockup n'a pas de service Compose |

`secrets-scan` (gitleaks) scanne tout le dépôt, **y compris `apps/web-mockup`** — c'est voulu (on veut
zéro secret partout), ce n'est pas un quality gate de qualité de code.

---

## 5. Limitation connue et assumée

`npm run build` du mockup (`tsc -b && vite build`) **échoue** : `vite.config.ts` importe `node:path` et
utilise `__dirname` alors que `@types/node` est **absent** des devDependencies du mockup (déjà le cas sur
la branche `mockups` — ce n'est pas un effet de la copie). On **ne corrige pas** ce prototype (hors
périmètre). Le chemin de lancement supporté et documenté est **`npm run dev`** (Vite), qui fonctionne :

```bash
cd apps/web-mockup
npm install      # 368 paquets
npm run dev      # Vite 5 → http://localhost:5173/ (HTTP 200, sert <title>StackNest</title>)
```

---

## 6. Vérifications (toutes passées)

| Critère | Vérification | Résultat |
| --- | --- | --- |
| CA1 | 216 fichiers copiés sous `apps/web-mockup/` via `read-tree` | ✅ |
| CA2 | `npm install && npm run dev` sert HTTP 200 (Vite 5.4.21, port 5173) | ✅ |
| CA3 | Exclusion documentée dans `ci.yml`, `sonar-project.properties`, `CLAUDE.md` | ✅ |
| CA4 | `git diff main -- apps/web` **vide** ; aucun untracked sous `apps/web` | ✅ |
| CA5 | Charte PDF dans `docs/` (2 178 853 octets, intégrité OK) | ✅ |
| Garde-fou | Aucun `node_modules/` ni `dist/` stagé (217 fichiers : 216 mockup + 1 PDF) | ✅ |

---

## 7. Workflow de livraison

Ce ticket a **dogfoodé STN-156** : le travail a été réalisé dans un worktree isolé créé via
`scripts/worktree.sh new feature/STN-157-integration-mockup-ref` (slot 1, projet `stacknest-wt1`),
sans perturber le dépôt principal ni la session parallèle traitant le bug `/api`.

```bash
# 1. worktree isolé depuis main (install root skippé : on n'a besoin que d'apps/web-mockup)
WORKTREE_SKIP_INSTALL=1 scripts/worktree.sh new feature/STN-157-integration-mockup-ref

# 2. copie AS-IS sans toucher apps/web
git read-tree --prefix=apps/web-mockup/ -u mockups:apps/web

# 3. charte → docs/
git cat-file -p "mockups:StackNest — Charte graphique.pdf" > "docs/StackNest — Charte graphique.pdf"

# 4. vérifs (CA2 dev, CA4 diff vide) puis commit FR ref STN-157 → PR → CI verte
```

---

## 8. Évolution future

- **Aucun commit fonctionnel** ne doit atterrir dans `apps/web-mockup`. C'est figé.
- Chaque écran du mockup est **redéveloppé ticket par ticket dans `apps/web`** (Clean Archi vertical
  slicing + TDD strict Red→Green→Blue), en s'inspirant visuellement du mockup.
- Quand toutes les features auront été réimplémentées proprement, `apps/web-mockup/` pourra être
  supprimé (ticket de nettoyage dédié) — la branche `mockups` restant l'archive d'origine.

---

## 9. Références

- Ticket : [STN-157](https://samrst-studies.atlassian.net/browse/STN-157)
- Spec liée : `docs/superpowers/specs/2026-06-04-worktree-convention.md` (STN-156)
- Charte graphique : `docs/StackNest — Charte graphique.pdf`
- Mémoire projet : décision « Option A » (2026-05-05) — branche `mockups` conservée comme référence visuelle.
