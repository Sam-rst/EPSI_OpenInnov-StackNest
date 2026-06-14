# StackNest — Business & stratégie de marché

> Volet **business / marché** du dossier de rendu — oral jury EPSI Open Innovation.
> Document structuré sur le **plan de présentation imposé** (1 → 6) : problématique & besoin,
> présentation de l'appli, stratégie d'insertion, pricing, démo, questions/réponses.
>
> **Hypothèse de modèle à valider** : StackNest est présenté comme une **offre hébergée freemium
> (SaaS)** *plus* une **option self-hostable / open-core**. C'est cohérent avec l'angle « self-hosted »
> du rapport technique (le MVP tourne en self-hosted) et nourrit la stratégie d'insertion *bottom-up*.
> Ce double modèle est une **hypothèse stratégique**, pas un engagement produit du MVP.
>
> **Sourcing prix** : tous les tarifs concurrents ci-dessous ont été **consultés le 14 juin 2026**
> (recherche web). Les chiffres marqués *(à re-vérifier)* n'ont pas de tarif public ferme et doivent
> être confirmés avant l'oral.

---

## 1. Problématique & besoin

### 1.1 Le besoin

Obtenir une ressource technique (une base de données pour tester, un cache, un environnement isolé,
une stack multi-services) reste un **point de friction** récurrent, et ce pour deux publics
distincts :

- **En entreprise** — l'obtention d'une ressource passe souvent par un **ticket Ops** : délai,
  dépendance à une personne, allers-retours. À l'inverse, laisser chaque développeur lancer ses
  conteneurs « à la main » produit de l'**hétérogénéité** (versions EOL, secrets en clair, ports en
  collision) et un risque de sécurité. Le besoin : **rendre les équipes autonomes** tout en
  **gardant le contrôle** (catalogue maîtrisé, versions cadrées, sécurité par défaut).

- **Chez l'étudiant** — pour un projet de cours (TP, hackathon, soutenance), il faut une BDD + un
  runtime + parfois un cache, **en quelques minutes**, **sans budget**, et **sans compétence infra**.
  La marche est haute : apprendre Docker, gérer les secrets, éviter les collisions de ports. Le
  besoin : **provisionner vite, gratuitement, sans rien savoir d'infra**.

Le fil rouge des deux cas : **l'autonomie encadrée**. On veut déployer soi-même, vite et proprement,
sans être ni bloqué par un Ops ni livré à soi-même.

### 1.2 Ce qu'il y a actuellement sur le marché

Le marché du déploiement self-service se segmente en trois familles :

1. **PaaS hébergés** (Railway, Render, Fly.io, Heroku, Koyeb) : on pousse du code, ils déploient.
   Simples, mais **facturés au service** et **orientés application web** (peu d'usage « catalogue de
   ressources internes »). Le free tier se **réduit** d'année en année (Heroku l'a supprimé en 2022,
   Fly.io n'en a plus pour les nouveaux comptes).
2. **IDP / plateformes d'ingénierie plateforme** (Qovery, Northflank, Porter, Humanitec,
   Platform.sh) : orientées **équipes**, souvent **BYOC** (Bring Your Own Cloud), facturées
   **par utilisateur actif** ou en custom entreprise. Puissantes mais **complexes** et **chères**
   pour un usage léger ou pédagogique.
3. **Self-hosted / open-core** (Coolify, Dokploy) : on installe la plateforme sur **son propre
   serveur**, gratuitement (open source), et on ne paie qu'un éventuel **cloud managé** pour le plan
   de contrôle. Le plus **proche de StackNest** en philosophie (self-hosted, coût = serveur).

### 1.3 Concurrents directs — tableau comparatif (tarifs consultés le 14 juin 2026)

| Concurrent | Positionnement | Modèle | Free tier | 1er payant | Source |
|---|---|---|---|---|---|
| **Railway** | PaaS hébergé, DX soignée | Hébergé | Essai : **$5 de crédit one-shot** (plus de free permanent) | **Hobby $5/mois** (crédits inclus) ; **Pro $20/mois/siège** + conso | [railway.com/pricing](https://railway.com/pricing) |
| **Render** | PaaS hébergé, web/API | Hébergé | **Hobby gratuit** : 750 h/mois, Postgres 1 Go (expire 30 j), services free en veille après 15 min | **Starter $7/mois/service** | [render.com/pricing](https://render.com/pricing), [costbench](https://costbench.com/software/developer-tools/render/) |
| **Fly.io** | PaaS hébergé, edge/VM | Hébergé (usage) | **Aucun free tier** (essai 2 h VM ou 7 j) | **~$1,94/mois** (conso minimale, pay-as-you-go) | [costbench](https://costbench.com/software/developer-tools/flyio/) |
| **Heroku** | PaaS historique | Hébergé | **Aucun** (free supprimé le 28 nov. 2022) | **Eco $5/mois** (dynos en veille) ; **Basic $7/mois** | [heroku.com/blog](https://www.heroku.com/blog/new-low-cost-plans/) |
| **Koyeb** | PaaS hébergé, serverless | Hébergé (usage) | **Starter gratuit** : 1 web service + 1 Postgres, 1 user, sans CB, jamais expiré, usage commercial OK | **Pro $29/mois** + conso ($10 de crédits) | [koyeb.com/docs](https://www.koyeb.com/docs/faqs/pricing) |
| **Northflank** | PaaS / IDP, prod | Hébergé (usage) | **Developer Sandbox gratuit** : 2 services, 1 DB, 2 cron (non-prod) | **Developer $10/mois** | [northflank.com/docs](https://northflank.com/docs/v1/application/billing/pricing-on-northflank) |
| **Qovery** | IDP, déploiement multi-env | BYOC | **1 000 min de déploiement/mois** offertes | **$29/user actif/mois** + $0,016/min de déploiement | [qovery.com/pricing](https://www.qovery.com/pricing) |
| **Platform.sh** | PaaS managé, agences | Hébergé | Essai **30 j** | **Development €12,25/mois** ; **Essential €22/mois** | [getapp](https://www.getapp.com/all-software/a/platform-sh/) |
| **Porter** | IDP, BYOC sur AWS/GCP | BYOC | **Programme startup** (25 vCPU / 50 Go, 6 mois) | Team **custom** *(à re-vérifier)* | [porter.run](https://www.porter.run/) |
| **Humanitec** | Platform orchestrator, grands comptes | Logiciel/SaaS | — | **Custom entreprise** *(à re-vérifier)* | [humanitec.com](https://humanitec.com/) |
| **Coolify** | Self-host open-core, alt. Heroku/Vercel | Self-host + cloud | **Self-hosted gratuit à vie** (Apache 2.0, toutes features) | **Cloud $5/mois** (2 serveurs ; +$3/serveur) | [coolify.io/pricing](https://coolify.io/pricing) |
| **Dokploy** | Self-host open-core | Self-host + cloud | **Self-hosted gratuit** (open source) | **Cloud $4,50/mois** (1 serveur ; +$3,50/serveur) | [dokploy.com/pricing](https://dokploy.com/pricing) |

> Lecture : les PaaS hébergés facturent **au service** (Render, Heroku) ou en **usage + siège**
> (Railway Pro), les IDP facturent **par utilisateur actif** (Qovery $29/user) ou en **custom**
> (Humanitec, Porter), et les self-hosted (Coolify, Dokploy) sont **gratuits sur ton serveur**, monétisés
> par un **cloud managé à quelques euros**. StackNest se place à l'intersection : **self-hostable et
> gratuit pour l'étudiant**, **hébergé et payant pour l'entreprise**.

### 1.4 Ce que StackNest fait de mieux (différenciateurs)

| Différenciateur | StackNest | Le marché |
|---|---|---|
| **Deux portes d'entrée** | UI catalogue **+ chat IA** en langage naturel (« déploie-moi un PostgreSQL 16 ») | Les PaaS/IDP exposent surtout du Git-push / des manifests ; pas d'assistant conversationnel câblé sur le catalogue réel |
| **Deux granularités** | Service unique **+ composeur de stack multi-services** (liens `{to.*}` câblés) | La plupart restent sur du « 1 service à la fois » manuel |
| **Catalogue maîtrisé** | Catalogue **fermé et cadré** (versions, LTS/EOL, gates de déployabilité) | Les PaaS laissent l'utilisateur tout configurer (risque d'hétérogénéité) |
| **Anti-hallucination IA** | Boîte à outils fermée + validation déterministe + confirmation obligatoire | Peu d'acteurs exposent un assistant qui **agit** réellement avec garde-fous |
| **Self-hostable + souveraineté** | Tourne **on-premise**, LLM **Ollama local** (données ne quittent pas le serveur) | Les PaaS hébergés impliquent un cloud tiers ; les IDP BYOC restent complexes |
| **Coût** | Self-hosted = coût du serveur ; freemium étudiant **0 €** | Free tiers en érosion (Heroku/Fly.io), facturation au service ou au siège |

**En une phrase** : StackNest combine la **simplicité d'un PaaS**, le **cadrage d'un IDP** et la
**souveraineté d'un self-hosted**, avec deux innovations différenciantes — le **chat IA qui agit** et
le **composeur de stack** — accessibles **gratuitement aux étudiants**.

---

## 2. Présentation de l'application

### 2.1 Ce qu'on propose

StackNest est une **Internal Developer Platform (IDP)** : un **guichet unique** pour provisionner des
ressources IT en autonomie, via **deux portes** (UI web + chat IA) et **deux granularités** (service
unique + stack multi-services). Le MVP livré couvre la chaîne complète :

- un **catalogue** de 45 templates réels (31 déployables en Docker, 14 cartes volontairement bloquées) ;
- le **déploiement Docker live** avec suivi temps réel (SSE) et cycle de vie complet ;
- un **composeur de stack** Docker Compose (assemblage de services + câblage de variables) ;
- un **chat IA** qui propose *deploy* **et** *compose_stack*, derrière une défense anti-hallucination ;
- l'**authentification**, le **dashboard** et les **actions en masse**.

### 2.2 Accompagnement

- **Chat IA guidé** : l'utilisateur décrit son besoin en français ; l'assistant **reformule**,
  **propose une action confirmable**, et **n'invente jamais** une ressource hors catalogue. C'est un
  copilote, pas un terminal.
- **Catalogue cadré** : versions pré-sélectionnées, indicateurs **LTS/EOL** colorés, **gates de
  déployabilité** — l'utilisateur est guidé vers ce qui marche, et on **ne propose jamais** ce qu'on
  ne sait pas provisionner proprement.
- **Defaults intelligents** : params par défaut, liens de stack pré-câblés (`{to.db}`, `{to.secret}`),
  secret généré automatiquement.

### 2.3 Simplicité

- **Zéro commande infra** : pas de `docker run`, pas de YAML à écrire à la main. On clique ou on
  discute.
- **États clairs** : Skeleton / Empty / Error sur chaque écran ; stepper de progression ; statut
  global **et** par service pour les stacks.
- **UI 100 % en français**, charte cohérente (bleu nuit, cyan, jaune).

### 2.4 Déploiement rapide

- **Provisioning réel en minutes** : le worker pull l'image et lance le conteneur via Docker SDK,
  publie un port libre, génère le secret, et **remonte la progression en SSE token par token**.
- **Stacks en un clic** : un graphe de services câblés se déploie comme un projet `docker compose`
  unique.
- **Plan de contrôle ≠ hôte d'exécution** : l'isolation est native, sans config supplémentaire pour
  l'utilisateur.

---

## 3. Stratégie d'insertion dans le secteur (bottom-up : étudiant → entreprise)

### 3.1 Le pari : *land-and-expand* par les étudiants

La stratégie d'insertion repose sur une **adoption ascendante (bottom-up)** :

1. **Habituer les étudiants** à prendre StackNest en main pour leurs **projets de cours (TP)**, gratuitement.
   L'outil devient un réflexe : « j'ai besoin d'une base → je la déploie sur StackNest en 30 secondes ».
2. Ces étudiants **se forment** sur la solution, en maîtrisent les concepts (catalogue, stack, chat IA),
   et en deviennent des **ambassadeurs**.
3. Une fois **embauchés en entreprise**, ces anciens étudiants **réintroduisent StackNest** dans leur
   équipe — « j'utilisais ça en école, c'est exactement ce qu'il nous faut pour arrêter les tickets Ops ».
4. L'entreprise adopte un **plan payant** (besoins pro : SLA, RBAC avancé, support, ressources, données dédiées).

C'est le modèle qui a fait le succès de Docker, GitHub, Notion, Figma : **on capte l'utilisateur tôt
(gratuit), il porte l'outil dans l'organisation (payant) plus tard**.

### 3.2 Leviers concrets

- **Free tier généreux pour les TP** : suffisant pour un projet de cours, **insuffisant pour un usage pro**
  (voir pricing §4) — l'étudiant n'a aucune raison de ne pas l'utiliser, l'entreprise a toutes les raisons de payer.
- **Self-hostable** : un étudiant ou un labo peut l'installer **gratuitement** sur une VM, ce qui
  maximise la diffusion et **alimente le bouche-à-oreille** sans coût d'acquisition.
- **Ancrage académique EPSI** : intégration dans les **cursus / projets étudiants** comme outil pédagogique
  de référence pour le déploiement (partenariat école → vivier d'ambassadeurs).
- **Open-core** : la communauté contribue, documente, étend le catalogue ; la marque gagne en crédibilité.

### 3.3 Métriques d'adoption visées (hypothèses)

- **Activation étudiant** : nombre de comptes étudiants ayant déployé ≥ 1 ressource sur un projet de cours.
- **Conversion ambassadeur → entreprise** : taux d'anciens étudiants ayant introduit StackNest dans leur équipe.
- **Expansion** : passage Free → Pro/Team au sein des équipes (seat expansion).

---

## 4. Pricing — modèle freemium

### 4.1 Principe directeur

Le pricing applique exactement la **stratégie d'insertion** :

> **Assez gratuit pour qu'un étudiant fasse tous ses TP** — **pas assez gratuit pour qu'une entreprise
> y échappe.**

Le **tier Free** est calibré sur l'usage pédagogique (quelques déploiements, ressources modestes,
rétention courte, **pas d'usage production**). Les tiers payants débloquent ce dont une **entreprise**
a besoin (SLA, support, RBAC/SSO, plus de ressources, **données dédiées / isolation renforcée**).

### 4.2 Grille freemium proposée (hypothèse à valider)

| Plan | Cible | Prix (hypothèse) | Quotas & inclus | Limites volontaires |
|---|---|---|---|---|
| **Free** | Étudiant / TP / découverte | **0 €** | Jusqu'à **3 déploiements actifs** ou **1 stack** ; ressources modestes (ex. 0,5 vCPU / 512 Mo par service) ; **rétention logs 7 j** ; communauté ; **1 utilisateur** | **Usage non-production** (CGU) ; pas de SLA ; pas de SSO ; pas de support prioritaire ; conso plafonnée |
| **Pro** | Dev indé / petite équipe | **~9 €/mois/utilisateur** | **10 déploiements** / **3 stacks** ; plus de ressources ; rétention 30 j ; email support ; chat IA avec budget de tokens étendu | Pas de SSO/SAML ; pas de données dédiées |
| **Team** | PME / équipe technique | **~25 €/mois/utilisateur** | Déploiements **étendus** ; **RBAC avancé**, **SSO**, audit log ; rétention 90 j ; support prioritaire ; multi-projets | — |
| **Entreprise** | Grand compte / souveraineté | **Sur devis** | **SLA contractuel**, **données dédiées / single-tenant**, **localisation UE garantie**, DPA, support dédié, on-premise/self-host assisté | — |
| **Self-hosted (open-core)** | Labo / étudiant avancé / souveraineté | **Gratuit** (le serveur reste à la charge de l'utilisateur) | Cœur open source, déploiements illimités sur **son** serveur | Features entreprise (SSO, support, cloud managé) réservées aux offres payantes |

> **Hypothèse double modèle** : l'offre **hébergée** (Free/Pro/Team/Entreprise) génère le revenu
> récurrent et porte la question RGPD/données cloud (cf. §6) ; l'offre **self-hosted open-core**
> maximise la diffusion (étudiants, labos) et alimente le *land-and-expand*. Les **prix sont des
> hypothèses** à valider par étude de marché.

### 4.3 Justification par le benchmark concurrent

- **Borne basse du Free** (3 déploiements, non-prod, 1 user) : alignée sur les free tiers
  **restrictifs mais réels** du marché — Render Hobby (750 h, Postgres expirant à 30 j),
  Northflank Developer Sandbox (2 services, 1 DB, **non-prod**), Koyeb Starter (1 service + 1 DB,
  1 user). On reprend la logique « **assez pour apprendre / tester, pas pour produire** », tout en
  restant **plus généreux que Railway** (qui n'offre plus qu'un crédit one-shot) et **Heroku/Fly.io**
  (plus de free tier du tout).
- **Pro à ~9 €/mois** : se positionne **sous** le premier palier « équipe » des concurrents
  (Railway Pro $20/siège, Koyeb Pro $29, Northflank Developer $10) pour capter le dev indé et la
  conversion depuis le Free.
- **Team à ~25 €/mois/user** : aligné sur le **standard du marché IDP** — **Qovery $29/user actif**,
  Render Standard $25/service, Koyeb Pro $29 — là où se situe la **valeur entreprise** (SSO, RBAC,
  support).
- **Entreprise sur devis** : cohérent avec **Humanitec** et **Porter** (custom), et avec le besoin de
  **données dédiées / souveraineté** (single-tenant, localisation UE) qui justifie une facturation
  négociée.
- **Self-hosted gratuit** : copie le modèle gagnant de **Coolify** (Apache 2.0, gratuit à vie) et
  **Dokploy** (open source), monétisés par un **cloud managé à quelques euros** — modèle qu'on peut
  reprendre pour un futur « StackNest Cloud » managé.

---

## 5. Démo

> La démonstration live est détaillée dans **`docs/rendu/guide-demo.md`** (10 min, bloc 5 du plan oral).

Fil rouge de la démo, qui **incarne** les arguments business ci-dessus :

1. **Catalogue & gates** — le cadrage maîtrisé (31 déployables / 14 bloqués).
2. **Déploiement Docker live** — la rapidité et le secret affiché une seule fois.
3. **Chat IA** — *deploy* puis *compose_stack* : les deux différenciateurs en action.
4. **Composeur de stack & détail 2 niveaux** — la granularité multi-services.
5. **Actions en masse & dashboard** — la vue de synthèse.

Message à faire passer : *« ce que je viens de montrer, un étudiant le fait gratuitement pour son TP,
et une entreprise le fait à l'échelle sur un plan payant. »*

---

## 6. Questions / réponses préparées

### 6.1 Gestion des données client en cloud (axe RGPD / gouvernance)

> Anticipé car le modèle **hébergé** implique de stocker des données client dans **notre** cloud.

| Question probable | Réponse préparée |
|---|---|
| **Où sont hébergées les données si on utilise l'offre cloud ?** | **Localisation UE** par défaut (datacenters dans l'Union européenne) ; pour l'offre **Entreprise**, localisation **garantie contractuellement** et option **single-tenant** / **self-hosted** pour les données les plus sensibles. |
| **Les données sont-elles chiffrées ?** | **Chiffrement in-transit** (TLS partout) et **at-rest** (volumes et base chiffrés). Les **secrets** ne sont **jamais persistés** : générés côté worker, injectés dans l'environnement du conteneur, **affichés une seule fois** ; le compose-file (qui contient les secrets) transite **par stdin**, jamais sur disque. |
| **Êtes-vous conformes RGPD ? Y a-t-il un DPA ?** | **Données minimales** (email + nom, pas d'IP stockée, âge ≥ 18 ans pour éviter le consentement parental) ; **privacy by design** (Ollama on-premise par défaut → les données ne quittent pas le serveur) et **by default** (rôle minimal) ; **droit à l'oubli** en cascade ; **rétention bornée** (logs 12 mois, conversations 6 mois, compte inactif 24 mois). Un **DPA** est fourni pour les offres Pro/Team/Entreprise. |
| **Et la réversibilité / le verrouillage fournisseur ?** | **Export** des données et **réversibilité** garantis : pas de format propriétaire fermé (catalogue et stacks descriptibles) ; **option self-hosted open-core** qui permet de **tout rapatrier** sur son propre serveur — l'anti-lock-in est un argument de vente. |
| **Comment isolez-vous les clients (multi-tenant) ?** | **Scoping par propriétaire** (`owner_id`) sur toutes les ressources ; **plan de contrôle ≠ hôte d'exécution** (les workloads ne tournent jamais sur le plan de contrôle) ; pour l'Entreprise, **isolation single-tenant** (données et exécution dédiées). |
| **Que se passe-t-il pour les données traitées par l'IA ?** | Le LLM **ne voit jamais un secret** ; en mode **Ollama on-premise**, **aucune donnée ne sort du serveur** ; tout recours à un fournisseur tiers (OpenAI/Anthropic) est **signalé à l'utilisateur** et désactivable. |

### 6.2 Autres questions probables (business / produit)

| Question probable | Réponse préparée |
|---|---|
| **Pourquoi un freemium et pas du payant direct ?** | Parce que la **stratégie d'insertion est bottom-up** : on capte l'étudiant gratuitement (TP), il devient ambassadeur, l'entreprise paie. Le Free est calibré **non-production** pour éviter qu'une entreprise y échappe. |
| **Vos prix tiennent-ils face aux concurrents ?** | Oui : Free **plus généreux** que Railway/Heroku/Fly.io (free en érosion), Pro **sous** le marché (~9 € vs $20–29), Team **aligné** sur Qovery/Render ($25–29), et **self-hosted gratuit** comme Coolify/Dokploy. *(Tarifs concurrents consultés le 14 juin 2026.)* |
| **Vos personas sont-ils réalistes ?** | Trois personas couvrent les deux cas : **Lucas** (étudiant, cas TP gratuit), **Sarah** (dev senior, sandbox isolé) et **Marc** (lead PME, cas entreprise self-hosted/payant). Voir §1 et le rapport technique. |
| **Comment évitez-vous les hallucinations de l'IA ?** | Défense en profondeur : **boîte à outils fermée** (le LLM ne voit que le catalogue réel), **validation déterministe** des arguments, le LLM **ne voit jamais un secret**, **confirmation obligatoire**, garde-fous métier (refus hors catalogue, rate-limit). |
| **Quel est le coût du LLM pour vous ?** | **Ollama local = 0 €** par défaut (on-premise) ; port LLM agnostique pour brancher OpenAI/Anthropic si besoin ; **budget de tokens** par plan pour maîtriser le coût variable. |
| **Pourquoi des cartes Terraform si elles ne marchent pas ?** | Elles montrent la **cible produit** ; le moteur est **pluggable** (interface `Provisioner`), Terraform/Proxmox est la **roadmap** — au MVP elles sont **bloquées** pour ne pas mentir à l'utilisateur. |
| **Quel est votre marché adressable ?** | Écoles et étudiants (acquisition gratuite, vivier d'ambassadeurs) ; PME et équipes tech (conversion payante) ; grands comptes souveraineté (offre Entreprise self-host/single-tenant). |

---

## Annexe — Personas (cas étudiant vs cas entreprise)

| Persona | Profil | Cas | Besoin | Valeur StackNest | Plan cible |
|---|---|---|---|---|---|
| **Lucas, 21 ans** | Étudiant | **Cas étudiant** | Une BDD + un runtime en < 2 min pour ses projets de cours, **budget 0 €**, **aucune compétence infra** | Provisionne depuis le catalogue ou le chat, 0 commande infra tapée | **Free** (TP) / self-hosted |
| **Sarah, 32 ans** | Dev senior | **Cas entreprise** | Un sandbox isolé avec BDD pour tester une migration sans impacter l'équipe | Déploiement isolé en minutes au lieu d'un ticket Ops de plusieurs jours | **Pro / Team** |
| **Marc, 38 ans** | Lead dev PME | **Cas entreprise** | Automatiser des envs de test sur un serveur local, **budget maîtrisé**, souveraineté | Plateforme **self-hosted** (pas de coût cloud par service) puis montée en **Team/Entreprise** | **Team / Entreprise** (ou self-hosted) |

**Lien insertion ↔ personas** : Lucas (étudiant Free) devient, une fois embauché, le **prescripteur**
qui amène StackNest chez Marc (PME, plan payant) — c'est le *land-and-expand* en action.

---

## Sources (consultées le 14 juin 2026)

- Railway — [railway.com/pricing](https://railway.com/pricing)
- Render — [render.com/pricing](https://render.com/pricing) · [costbench](https://costbench.com/software/developer-tools/render/)
- Fly.io — [costbench](https://costbench.com/software/developer-tools/flyio/)
- Heroku — [heroku.com/blog (low-cost plans)](https://www.heroku.com/blog/new-low-cost-plans/)
- Koyeb — [koyeb.com/docs (pricing FAQ)](https://www.koyeb.com/docs/faqs/pricing)
- Northflank — [northflank.com/docs (billing/pricing)](https://northflank.com/docs/v1/application/billing/pricing-on-northflank)
- Qovery — [qovery.com/pricing](https://www.qovery.com/pricing)
- Platform.sh — [getapp.com/all-software/a/platform-sh](https://www.getapp.com/all-software/a/platform-sh/)
- Porter — [porter.run](https://www.porter.run/) *(tarif équipe : à re-vérifier)*
- Humanitec — [humanitec.com](https://humanitec.com/) *(tarif : custom, à re-vérifier)*
- Coolify — [coolify.io/pricing](https://coolify.io/pricing)
- Dokploy — [dokploy.com/pricing](https://dokploy.com/pricing)
