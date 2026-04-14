# Modifications a apporter au Cahier des Charges

> Ce document liste les modifications et ajouts a integrer dans le cahier des charges StackNest, suite au brainstorming technique du 14 avril 2026 et aux retours du prof.

---

## 1. Stack technique — mettre a jour

Remplacer la stack technique actuelle par :

| Composant | Technologie | Justification |
|---|---|---|
| Frontend | React + Vite + TypeScript (SPA) | Pas besoin de SSR/SEO, plus simple que Next.js |
| Backend API | FastAPI (Python 3.13) | Async natif (SSE, LLM streaming), Pydantic, clean archi |
| Worker/Runner | Python 3.13 + Terraform CLI (isole du web) | Execute Terraform, communique via Redis |
| IA Service | Architecture pluggable : Ollama (defaut) / OpenAI (fallback) | Zero cout, on-premise, RGPD-friendly |
| BDD | PostgreSQL 16 | Standard, robuste |
| Cache/Queue | Redis 7 | Queue de jobs + pub/sub temps reel (SSE) |
| IaC | Terraform (Docker provider MVP, Proxmox stretch) | Docker d'abord, VMs Proxmox si le temps le permet |
| Conteneurisation | Docker Compose | Obligatoire pour la demo |
| CI | GitHub Actions (runner cloud) | Standard |
| CD | Self-hosted GitHub Actions runner | Zero port entrant |
| Package manager | uv (Python) | Rapide, lockfile natif |
| Secrets | Variables d'env chiffrees (Vault en post-MVP) | Simple pour le MVP |
| Auth | JWT + RBAC (lot 1), MFA TOTP (lot 2) | Progressif |

**Justification FastAPI vs Django** (a ajouter pour preparer l'oral) :
- Async natif necessaire pour SSE temps reel, appels LLM streaming, orchestration Terraform non-bloquante
- Pydantic natif reutilisable pour valider les outputs LLM (anti-hallucination)
- OpenAPI/Swagger auto-genere (demo)
- Clean Architecture naturelle avec dependency injection
- Django est concu pour des apps web CRUD+templates classiques, pas pour notre use case

---

## 2. Pricing — nouvelle section a ajouter

| Offre | Prix | Contenu |
|---|---|---|
| **Free** | 0€ | 1 projet, 2 ressources max, templates de base, pas de chatbot IA |
| **Pro** | ~15€/mois | Projets illimites, toutes les ressources, chatbot IA, support prioritaire |
| **Enterprise** | Sur devis | Deploiement on-premise, SLA, support dedie, audit securite |

- Periode de test : 14 jours Pro gratuit
- Cles de licence generees a l'inscription, liees au compte, duree = abonnement actif
- Modele freemium SaaS : la version Free permet de decouvrir le produit, la version Pro monetise les features avancees (IA, ressources illimitees)

**Comparaison avec la concurrence :**
- Heroku : 5-50$/mois/service → ratio ~x3 a x10 plus cher que StackNest Pro pour un usage equivalent
- Railway : 5-20$/mois → comparable en prix mais vendor lock-in
- Portainer Business : 15$/noeud/mois → pas d'IA, pas de catalogue
- StackNest self-hosted : cout du serveur uniquement (~50€/mois pour tout)

---

## 3. Personas — remplacer par des versions detaillees

### Persona 1 — Lucas, 21 ans, etudiant en informatique (L3/M1)

- **Objectif** : provisionner une BDD + runtime en moins de 2 minutes pour ses projets de cours
- **Contraintes** : budget 0€, pas de connaissances infra/DevOps, veut se concentrer sur le code
- **Outils quotidiens** : VS Code, GitHub, Terminal, Docker Desktop (basique)
- **KPIs** :
  - Temps de provisionnement : < 2 min (vs ~30 min manuellement)
  - Commandes infra tapees : 0
- **Scenario** : Lucas doit rendre un projet Node.js + PostgreSQL pour son cours. Il ouvre StackNest, selectionne "PostgreSQL 16" et "Node 20" dans le catalogue, clique "Deployer", et recoit ses credentials en 90 secondes. Il peut coder immediatement.

### Persona 2 — Sarah, 32 ans, dev senior (startup SaaS, 15 devs)

- **Objectif** : instancier un sandbox isole avec BDD repliquee pour tester une migration sans impacter l'equipe
- **Contraintes** : 15 devs partagent un env de dev, pas d'acces admin cloud, doit attendre les Ops pour chaque demande (delai moyen 3 jours)
- **Outils quotidiens** : IntelliJ, Jira, GitLab CI, Slack, Datadog
- **KPIs** :
  - Delai de provisionnement : 5 min (vs 3 jours via ticket Ops)
  - Tickets Ops crees : 0
- **Scenario** : Sarah doit tester une migration PostgreSQL 15 → 16 sans risquer de casser l'env de dev partage. Elle demande au chatbot "Je veux un PostgreSQL 16 isole avec les memes donnees de test". Le chatbot propose la config, elle valide, et son sandbox est pret en 2 minutes.

### Persona 3 — Marc, 38 ans, lead dev PME (8 devs)

- **Objectif** : automatiser le deploiement d'envs de test sur serveur local avec budget limite
- **Contraintes** : pas de budget cloud (< 50€/mois), un seul serveur physique, pas d'equipe Ops dediee
- **Outils quotidiens** : GitHub, Docker Compose, Terraform (basique), Proxmox
- **KPIs** :
  - Cout infra mensuel : 50€/mois (vs 200€/mois cloud)
  - Temps setup env de test : 10 min (vs 2h manuellement)
- **Scenario** : Marc installe StackNest sur son serveur Proxmox. Ses devs peuvent provisionner des envs de test en self-service sans passer par lui. Il garde le controle via le RBAC (quotas, permissions).

---

## 4. Benchmark concurrence — nouvelle section a ajouter

| Concurrent | Type | Prix | Forces | Faiblesses vs StackNest |
|---|---|---|---|---|
| Heroku | PaaS cloud | Eco 5$/mois, Standard 25-50$/mois | Simple, ecosysteme mature | Pas self-hosted, couteux a l'echelle, pas d'IaC |
| Railway | PaaS cloud | Usage-based 5-20$/mois, Pro 20$/mois | DX moderne, deploiement Git | Pas self-hosted, vendor lock-in |
| Render | PaaS cloud | Free tier, Individual 7$/mois, Team 19$/mois | Bon free tier | Pas self-hosted, limite en IaC |
| Portainer CE | Self-hosted | Gratuit (CE), Business 15$/noeud/mois | Docker management complet | Pas d'IA, pas de catalogue, UI complexe |
| Coolify | Self-hosted | Gratuit (self-hosted), Cloud 5$/mois | Open source, simple | Pas d'IA, pas de Terraform, petite communaute |
| Backstage | IDP open source | Gratuit | Standard IDP, plugin ecosystem | Tres complexe a setup, pas de provisionnement natif |

**Positionnement StackNest** : combine le meilleur du self-hosted (cout fixe, donnees on-premise, 0 vendor lock-in) avec des features IDP avancees (chatbot IA, Terraform natif, catalogue de services).

---

## 5. Anti-hallucination IA — nouvelle section a ajouter dans les contraintes

Le chatbot IA utilise une architecture en pipeline avec validation deterministe :

1. **LLM traduit** la demande en intention structuree (JSON schema strict)
2. **Validateur deterministe** (code, pas IA) verifie :
   - Les ressources existent dans le catalogue
   - Les parametres sont dans les bornes autorisees
   - L'utilisateur a les permissions RBAC
   - Le plan Terraform est syntaxiquement valide (`terraform validate`)
3. **Si invalide** → re-prompt le LLM avec l'erreur (max 3 tentatives)
4. **Si toujours invalide** → fallback vers la selection manuelle du Store
5. **Jamais d'execution sans confirmation explicite de l'utilisateur**

Garde-fous supplementaires :
- Catalogue ferme : le LLM ne peut proposer que ce qui existe en BDD
- Logs de chaque echange LLM pour audit (equipe cyber)
- Architecture pluggable : si un seul LLM ne suffit pas, evolution possible vers du multi-agents (CrewAI, n8n) sans refactoring

**Pourquoi pas n8n pour le MVP** : notre pipeline maison est plus simple, testable en TDD, et ne necessite pas de service supplementaire. n8n reste une option pour les phases ulterieures si la complexite des workflows IA augmente.

---

## 6. RGPD — mettre a jour la section existante

### Donnees collectees (exhaustif)

- **Email professionnel** : identification, communication
- **Nom** : affichage dans l'interface
- **Mot de passe** : stocke en hash bcrypt (jamais en clair)
- **Pas d'IP stockee** : rate limiting par user authentifie
- **Age minimum 18 ans** : checkbox a l'inscription + mention dans les CGU

### Privacy by design

- Ollama on-premise par defaut → les donnees (prompts, conversations) ne quittent jamais le serveur
- Si fallback vers OpenAI → l'utilisateur est averti explicitement que ses donnees transitent vers un tiers
- Les mots de passe des ressources deployees ne sont jamais stockes en clair — affiches une seule fois
- Logs anonymises par defaut
- Pas de tracking, pas d'analytics, pas de cookies tiers

### Privacy by default

- Compte cree avec permissions minimales (role `user`)
- Pas de collecte au-dela du strict necessaire
- Les donnees ne sont pas partagees avec des tiers (sauf si fallback OpenAI, avec consentement)

### Conservation des donnees

| Type de donnee | Duree de conservation | Justification |
|---|---|---|
| Compte utilisateur actif | Duree de l'abonnement | Necessaire au service |
| Compte inactif | Purge apres 24 mois | Droit a l'oubli |
| Logs de deploiement | 12 mois | Tracabilite, debug |
| Conversations chatbot | 6 mois | Amelioration du service |
| Donnees de paiement | Pas stockees (delegue au prestataire) | Conformite PCI-DSS |

### Donnees diffusees hors de la stack

- **Ollama (defaut)** : aucune donnee ne quitte le serveur
- **OpenAI (fallback)** : les prompts utilisateur sont envoyes a l'API OpenAI. OpenAI s'engage a ne pas utiliser les donnees API pour l'entrainement (policy API). L'utilisateur est averti et doit consentir.
- **Aucune autre API externe** ne recoit de donnees utilisateur

### Droit a l'oubli

- Endpoint `DELETE /users/{id}` qui cascade sur toutes les donnees :
  - Compte utilisateur
  - Deploiements et ressources associees
  - Conversations chatbot
  - Logs lies a l'utilisateur

---

## 7. Livrables — remplacer la section existante

| Lot | Livrable | Description |
|---|---|---|
| 1 | **Applicatif StackNest** | SPA React + API FastAPI + Worker Terraform + Docker Compose |
| 2 | **Site vitrine** | Landing page statique (features, pricing, personas, CTA) |
| 3 | **Modules Terraform** | Bibliotheque de templates Docker (PostgreSQL, MySQL, Redis, MongoDB, Node, Python, Nginx) |
| 4 | **Documentation technique** | README, spec architecture, guides d'installation |
| 5 | **Documentation utilisateur** | Guides in-app integres a l'application |
| 6 | **Video demo** | Scenario complet : chatbot deployant une infrastructure |

---

## 8. Roadmap — remplacer la section existante

| Phase | Periode | Contenu | Livrable |
|---|---|---|---|
| Phase 1 | Avril 2026 | Setup CI/CD, Docker Compose, structure projet, spec technique | Repo configure, spec validee |
| Phase 2 | Avril-Mai 2026 | Store + Auth + Terraform runner | v0.1.0 (Store+Auth) + v0.2.0 (Terraform) |
| Phase 3 | Mai-Juin 2026 | Chatbot IA + Dashboard basique | v0.3.0 — **demo jury juin** |
| Phase 4 | Sept-Dec 2026 | MFA, Proxmox provider, site vitrine, finitions | v0.4.0 |
| Phase 5 | Jan-Juin 2027 | Beta testing, feedback utilisateurs, commercialisation, mise en production | v1.0.0 |

**Jalons cles :**
- **Juin 2026** : presentation MVP devant jury (v0.3.0 avec chatbot)
- **Decembre 2026** : applicatif complet + site vitrine (v0.4.0)
- **Juin 2027** : commercialisation, release publique (v1.0.0)

---

## 9. Specifications d'exploitation — section a ajouter

### Documentation

- **Documentation technique** : README, spec architecture, guides d'installation (markdown dans le repo)
- **Documentation utilisateur** : guides in-app integres a l'application (pas du markdown brut — une section `/docs` dans le frontend avec rendu stylise)
- Ce sont deux livrables distincts avec des audiences differentes

### Maintenance applicative

- Les containers deployes par les utilisateurs sont sous leur responsabilite
- v1.0 : alertes quand une version deployee passe en EOL + bouton de mise a jour de version
- Les templates du catalogue sont maintenus par l'equipe (veille EOL, audit CVE, mise a jour des versions)
- Mises a jour de securite de la plateforme elle-meme : patches reguliers via la CI/CD

---

## 10. Decoupage fonctionnel — section a mettre a jour

### 5 fonctionnalites principales (inchangees)

1. **Service Catalog (Store)** — avec gestion des versions LTS/EOL par template
2. **AI ChatOps** — architecture pluggable (Ollama/OpenAI/Gemini), validation deterministe anti-hallucination
3. **Automation Engine** — Worker Terraform isole, suivi temps reel SSE, rollback automatique
4. **Dashboard** — Vue des ressources deployees, acces, statuts
5. **User Management** — RBAC (admin/user), JWT, MFA en lot 2

### Precision sur l'IA (reponse au commentaire du prof)

Un simple connecteur LLM est notre MVP. L'architecture permet d'evoluer vers :
- **Multi-agents (CrewAI/SMA)** si la complexite augmente
- **n8n comme orchestrateur** pour les workflows IA avances
- **Gemini/GCP** comme provider LLM supplementaire

Ces evolutions sont possibles sans refactoring grace au vertical slicing du module `chat/`.
