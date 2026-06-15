# Prompt Claude Design — Dossier de rendu unique StackNest

> Copier-coller le bloc ci-dessous dans Claude Design, **en pièces jointes les 3 sources** :
> `rapport-technique.md`, `cahier-des-charges.md`, `business-strategie.md` (dossier `docs/rendu/`).
> (Hors périmètre de ce document : les slides de présentation et le guide de démo, faits à part.)

---

## PROMPT

Tu es un·e **designer-rédacteur·rice technique senior**. Produis **UN SEUL document professionnel, long et soigné** (format A4 portrait, type « dossier de rendu » — **PAS** de slides) : le **dossier de présentation de StackNest** pour une **soutenance orale de jury EPSI (Open Innovation)**. Le jury évalue **à la fois la dimension produit/business ET la rigueur technique**.

### Sources (à utiliser comme vérité — ne rien inventer)
Je te joins 3 fichiers à **fusionner et harmoniser** en un document unique et cohérent (pas 3 docs collés) :
1. `rapport-technique.md` (architecture, stack, fonctionnalités, sécurité/RGPD, qualité, méthodo) ;
2. `cahier-des-charges.md` (besoins, exigences, périmètre, contraintes, planning) ;
3. `business-strategie.md` (marché, concurrents sourcés, personas, pricing, stratégie d'insertion, Q&R).
Reprends les **chiffres et tarifs tels quels** depuis ces sources ; conserve les mentions « à re-vérifier » (Porter, Humanitec) ; ne fabrique aucune donnée.

### Image de marque — charte StackNest (à appliquer partout)
- **Couleurs** : Bleu nuit `#032233` (couleur primaire — titres, bandeaux, fonds d'accent) · Cyan `#0d9297` (accent — sous-titres, liens, filets, puces) · Jaune `#fea21f` (highlights, encadrés « point clé », CTA) · Rouge erreur `#c42b1c` · Vert succès `#22c55e`. Fonds clairs, texte très lisible (contraste AA).
- **Typographie** : **Inter** (ou Roboto) pour le texte et les titres ; **JetBrains Mono** pour le code, les commandes, les noms techniques.
- **Logo StackNest** : en page de garde et en en-tête/pied de page (logos dispo dans `docs/brand/assets/`). Si non fourni, réserve un emplacement logo propre.
- **Style** : épuré, moderne, « tech / Internal Developer Platform » ; tableaux nets (en-tête bleu nuit, lignes alternées) ; **encadrés colorés** pour les points clés / différenciateurs / chiffres ; **schéma d'architecture** clair ; iconographie sobre et cohérente. Ton **professionnel, pédagogue, confiant**, en **français**.

### Structure imposée (un seul document, sections numérotées, avec sommaire)
0. **Page de garde** : logo, « StackNest — Internal Developer Platform », sous-titre « Dossier de rendu — Soutenance jury EPSI Open Innovation », équipe (Dev : Samuel Ressiot — tech lead, Yassine Zouitni ; Cyber : Antony Lozano, Remi Reze, Thomas Bremard ; Design/QA : Julien Volmerange, Mahe Pernot), date (juin 2026).
1. **Sommaire** (table des matières paginée).
2. **Résumé exécutif** (½ page : le quoi, le pour qui, le différenciateur, l'état d'avancement).
3. **Problématique & besoin** : la friction actuelle (obtenir une ressource = ticket Ops / hétérogénéité du « à la main »), ce qui existe **aujourd'hui sur le marché**, et le besoin d'**autonomie encadrée**.
4. **Marché & concurrence** : panorama du secteur (PaaS hébergés, IDP, self-host open-core) + **tableau comparatif des concurrents** (positionnement + **tarifs sourcés et datés**) + **différenciateurs StackNest** (chat IA qui agit, composeur de stack câblée, self-host possible, déploiement réel sûr).
5. **Personas & cas d'usage** : présenter les personas (étudiant, dev senior, lead PME) et bien distinguer **cas étudiant** vs **cas entreprise**.
6. **Présentation du produit** : ce qu'on propose et la promesse — **accompagnement, simplicité, déploiement rapide** — illustrée par les fonctionnalités réelles : catalogue (45 templates, blocages lisibles), déploiement Docker live + cycle de vie, **composeur de stack Docker Compose** (services câblés), **chat IA** (déploie ET compose, avec confirmation), dashboard, actions en masse.
7. **Stratégie d'insertion dans le secteur** : adoption **bottom-up** — habituer les **étudiants** à l'outil (gratuit pour leurs TP) pour qu'il soit **introduit ensuite en entreprise** par ces anciens étudiants une fois embauchés (land-and-expand).
8. **Modèle économique & pricing** : **freemium** détaillé (grille Free / Pro / Team / Entreprise + self-host), **justifié par le benchmark concurrent**, avec le principe directeur : *assez gratuit pour les TP étudiants, pas assez pour qu'une entreprise échappe à un plan payant*.
9. **Architecture & stack technique** : monorepo modulaire, **Clean Architecture + vertical slicing** (back & front), **schéma d'architecture** (plan de contrôle vs hôte d'exécution, services Docker, flux SSE/queue, LLM pluggable), et **choix techniques justifiés** (FastAPI, React/Vite/TS, PostgreSQL, Redis/arq, Docker SDK + compose, LLM Ollama/OpenAI/Anthropic).
10. **Sécurité & RGPD** : secrets générés worker-side jamais persistés, compose-file via stdin, anti-hallucination du chat (défense en profondeur), gates de déployabilité, isolation ; **gouvernance des données client en cloud** (localisation UE, chiffrement, RGPD/DPA, réversibilité, multi-tenant) — présentée comme **politique by design**.
11. **Qualité & méthodologie** : TDD strict (Red→Green→Blue), **chiffres de tests réels** (1 184 tests back / 903 front, 11 migrations), gates CI (lint/format/types/tests/sécurité), Trunk-Based Dev, cycle de review, développement multi-agents en worktrees.
12. **Cahier des charges** : **exigences fonctionnelles** (par domaine) + **non-fonctionnelles** (perf, sécurité, dispo, RGPD, maintenabilité), **périmètre MVP vs roadmap**, contraintes (technos, VPN, serveur Proxmox, 4 environnements), **planning sur 2 ans** (jalons), critères d'acceptation globaux.
13. **Bilan & roadmap** : ce que le MVP atteint + prochaines étapes (cycle de vie par service des stacks, vraie pause, déploiements Terraform, MFA, 2ᵉ LLM « juge »).

### Chiffres clés à faire ressortir (encadrés/infographies)
45 templates au catalogue · **31 déployables** / 14 bloqués (10 Terraform + 4 runtimes) · **1 184 tests backend** + **903 frontend** · 11 migrations · freemium **Free 0 € / Pro ~9 € / Team ~25 €/user / Entreprise sur devis / self-host gratuit**.

### Emplacements de captures d'écran (à intégrer en zones réservées « 📷 Capture : … »)
1. Connexion/inscription · 2. Catalogue (grille + filtres + carte bloquée) · 3. Configuration d'un déploiement · 4. Déploiement live (progression + logs + accès) · 5. Builder de stack (services + liens) · 6. Détail stack + page service · 7. Chat IA composant une stack Node + Postgres · 8. Dashboard.
Laisse pour chacune un **encadré placeholder élégant** (bordure cyan, fond gris clair) que je remplacerai.

### Format & contraintes
- Document **A4 portrait, multi-pages**, sommaire paginé, en-têtes/pieds de page avec numéros, hiérarchie de titres claire, tableaux et encadrés stylés, **au moins un schéma d'architecture**.
- **Langue : français.** Ton pro + pédagogue.
- **NE PAS produire** : de slides de présentation, ni de guide de démo (faits séparément).
- **NE PAS inventer** de chiffres ni de tarifs : t'appuyer sur les 3 sources jointes ; conserver les « à re-vérifier ».
- Sortie souhaitée : **un document unique** (PDF/doc) prêt à rendre, fidèle au contenu des sources mais **réorganisé, harmonisé et mis en page** selon la structure ci-dessus et la charte StackNest.
