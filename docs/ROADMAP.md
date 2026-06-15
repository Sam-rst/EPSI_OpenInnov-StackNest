# StackNest — Roadmap

> Roadmap **versionnée** consolidant le bilan du rapport technique
> ([`docs/rendu/rapport-technique.md`](rendu/rapport-technique.md), §4 et §11) et la vision business
> ([`docs/rendu/business-strategie.md`](rendu/business-strategie.md)). Les versions suivent le
> **SemVer** du projet (`v0.X.0-rc.N` → `v0.X.0` → `v0.X.1`).
>
> ⚠️ Les jalons post-v0.6.0 sont **prévisionnels** (priorisation par sprint planning) et le double
> modèle économique (hébergé + self-host open-core) reste une **hypothèse stratégique** à valider,
> pas un engagement produit.

---

## Vue d'ensemble

| Version | Horizon | Thème | Statut |
|---|---|---|---|
| **v0.6.0** | Actuel | MVP livré (jury) | ✅ Livré |
| **v0.7.0 / v0.8.0** | Court terme | Cycle de vie fin des stacks, vraie pause, sortie de bêta, MFA | 🔜 Planifié |
| **v0.9.0** | Moyen terme | Provisioning Terraform/Proxmox, scaling, LLM « juge » | 🧭 Cible |
| **v1.0.0** | GA (post-jury) | Offre stabilisée, multi-tenant cloud, observabilité complète | 🎯 Vision |

---

## v0.6.0 — MVP livré (actuel)

État réel du code à la date de l'oral jury. Chaîne complète de provisioning sous **TDD strict**
(1 184 tests backend, 903 cas frontend) et CI multi-lanes.

- **Auth** : inscription, vérification email, login JWT (access + refresh), logout, `/me`, mot de
  passe oublié + reset, RBAC admin/user, CLI `create-admin`.
- **Catalogue** : 45 templates (versions + LTS/EOL), filtres, détail, **gates de déployabilité**
  (31 ressources Docker déployables, 14 cartes bloquées : 10 Terraform + 4 runtimes), CRUD admin.
- **Déploiement Docker live** : provisioning via Docker SDK, suivi **SSE** temps réel, cycle de vie
  complet (create / stop / start / regenerate / destroy), secret généré côté worker et affiché une fois.
- **Composeur de stack Docker Compose** *(bêta)* : assemblage de N services + liens `{to.*}`,
  déploiement comme un projet `docker compose`, détail à 2 niveaux (stack + service).
- **Chat IA** : assistant guidé + confirmation, actions `deploy` **et** `compose_stack`
  (+ stop/start/regenerate), streaming SSE, fils multiples, 3 adaptateurs LLM (Ollama/OpenAI/Anthropic),
  défense anti-hallucination (boîte à outils fermée + validation déterministe).
- **Dashboard** (KPIs + sections) et **actions en masse** (bulk) sur déploiements et stacks.
- **Infra/qualité** : Docker Compose (base + dev + preview), CI GitHub Actions, worktrees multi-agents.

---

## v0.7.0 / v0.8.0 — Court terme

Renforcer et **stabiliser** l'existant : passer les stacks de la bêta au statut « stable » et
affiner le contrôle du cycle de vie.

- **Cycle de vie par service dans les stacks** : stop / start **isolé** d'un service d'une stack
  (sans toucher aux autres) et **édition** d'une stack déjà déployée.
- **Vraie pause** (`docker pause`) au lieu d'un stop/start, pour suspendre sans recréer le conteneur.
- **Stabilisation / sortie de bêta** du composeur de stack (retrait des bannières « bêta »).
- **MFA TOTP** sur l'authentification (durcissement compte).
- Action IA `compose_stack` **pré-remplissant le builder** (le modèle est déjà câblé pour le proposer).

---

## v0.9.0 — Moyen terme

Débloquer les capacités d'infrastructure et passer à l'échelle.

- **Déploiements Terraform / Proxmox** : provisioning réel des **10 cartes infra** aujourd'hui
  bloquées au catalogue (VM Ubuntu, ELK, VPC, S3, Kubernetes, base managée, load balancer, DNS, CDN,
  serverless). Le moteur est **pluggable** par conception (interface `Provisioner`) — provider Docker
  livré, provider Terraform/Proxmox ajouté ici.
- **Réplicas / scaling horizontal** : plusieurs instances d'un service au sein d'une stack.
- **2ᵉ LLM « juge »** anti-hallucination : un modèle relit l'action proposée **avant** la carte de
  confirmation (défense en profondeur supplémentaire au chat IA).

---

## v1.0.0 — GA (post-jury)

Industrialisation de l'offre, en cohérence avec le modèle économique du volet business.

- **Offre stabilisée** : tiers Free / Pro / Team / Entreprise + self-hosted open-core (hypothèse de
  pricing du dossier business à valider par étude de marché).
- **Multi-tenant cloud** : isolation renforcée par locataire (`owner_id` déjà en place), option
  **single-tenant** / **localisation UE garantie** pour l'offre Entreprise (RGPD, DPA).
- **Observabilité complète** : métriques et traces au-delà des logs structlog + Sentry actuels,
  tableaux de bord d'exploitation, alerting.
- **Réversibilité / anti-lock-in** : export des données et stacks, option de rapatriement self-hosted.

---

## Vision 2 ans (jalons macro)

1. **Adoption bottom-up (étudiant → entreprise)** : ancrage académique EPSI, free tier étudiant à 0 €
   et self-hostabilité pour maximiser la diffusion ; les étudiants formés deviennent ambassadeurs
   puis prescripteurs en entreprise (*land-and-expand*).
2. **Souveraineté & conformité** : privacy by design (LLM Ollama on-premise par défaut), DPA,
   rétention bornée, données UE — argument de vente pour PME et grands comptes.
3. **Ouverture de l'écosystème** : modèle **open-core** (cœur open source, features entreprise
   payantes), contributions communautaires sur le catalogue et les providers.
4. **Montée en puissance infra** : au-delà de Docker et Terraform/Proxmox, cibler des hôtes
   d'exécution variés (VM, Kubernetes) tout en conservant la règle structurante **plan de contrôle ≠
   hôte d'exécution**.

> Détails marché, pricing et personas : [`docs/rendu/business-strategie.md`](rendu/business-strategie.md).
> Bilan technique et prochaines étapes : [`docs/rendu/rapport-technique.md`](rendu/rapport-technique.md).
