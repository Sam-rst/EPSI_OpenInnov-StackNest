# Chat IA (ChatOps) — Design

> Statut : design validé en brainstorming (2026-06-08). Épic **STN-4 ChatOps**.
> Préalable bâti et mergé : **déploiement Docker full-stack** (catalogue → API `/deployments` →
> worker → SSE authentifié). Le Chat IA s'appuie dessus, il ne le réimplémente pas.

## 📋 Contexte & objectif

Le Chat IA est le **différenciateur** de StackNest : permettre à un membre de l'équipe de
**provisionner une ressource en langage naturel** (« déploie-moi un Postgres 16 pour tester »)
plutôt que de remplir un formulaire. L'enjeu n'est pas la conversation pour la conversation, mais
de **traduire une intention en action réelle et sûre**, sans hallucination et avec l'humain dans la
boucle.

Objectif MVP : un **assistant guidé** qui comprend l'intention, la mappe sur le catalogue réel,
**propose** une action que l'utilisateur **confirme**, puis réutilise le use case de déploiement
existant. Tout effet de bord passe par une confirmation explicite (cohérent avec le modèle de
sécurité du produit).

## 🎯 Décisions (verrouillées en brainstorming)

1. **Assistant guidé avec confirmation** — ni autonome (jamais d'action sans validation), ni
   simple conseiller read-only.
2. **Périmètre des actions** : `déployer`, `arrêter`, `démarrer`, `régénérer le secret`.
   **`détruire` est exclu du chat au MVP** (action irréversible → reste dans l'UI déploiement, → V2).
3. **Mécanisme : tool-calling contraint** + **5 couches de défense anti-hallucination** (cf. §7).
4. **Confirmation avancée** : carte d'action inline avec **reformulation explicite de l'intention**
   par l'IA + bouton **« Modifier »** avant exécution.
5. **Port `LLMProvider` agnostique du fournisseur** : la logique métier (messages + définition
   d'outils → réponse ou appel d'outil) est identique ; on branche l'adaptateur voulu
   (OpenAI, Ollama, **Anthropic/Claude**, …). Aucun verrouillage fournisseur.
6. **Fils de discussion multiples par utilisateur** (CRUD minimal : créer / renommer / supprimer /
   switcher). Pas de dossiers / recherche / partage (→ V2).
7. **Streaming SSE token-par-token** des réponses — réutilise le pattern **fetch-SSE + Bearer**
   fiabilisé pour le déploiement (`@microsoft/fetch-event-source`, cf. PR #47).
8. **Layout 3 colonnes** (fidèle au mockup de Yassine, adapté) :
   `conversations | fil + composer | aside contexte live`.

## 🏗️ Architecture backend — `apps/api/app/chat/` (Clean Archi, vertical slice)

### Modèle de domaine
- **Entités** : `Conversation` (id, owner_id, title, created_at, updated_at),
  `Message` (id, conversation_id, role, content, created_at).
- **Action** : `ChatAction` (id, conversation_id, message_id, kind, args, status, deployment_id?,
  created_at) — trace auditable d'une action proposée puis confirmée/rejetée/exécutée.
- **Value Objects** : `ToolDefinition`, `ToolCall`, `ActionProposal` (kind + args validés +
  reformulation + récap), `ChatMessage` (rôle + contenu pour le LLM), `LLMChunk` (delta texte
  *ou* appel d'outil).
- **Enums** : `MessageRole` (`user` / `assistant` / `tool`), `ActionKind`
  (`deploy` / `stop` / `start` / `regenerate`), `ActionStatus`
  (`proposed` / `confirmed` / `rejected` / `executed` / `failed`).
- **Interfaces (ports)** :
  - `LLMProvider` — `stream(messages, tools) -> AsyncIterator[LLMChunk]` (+ variante non-stream).
    **Agnostique du fournisseur.**
  - `ConversationRepository`, `ChatActionRepository`.
  - `ChatEventPublisher` (réutilise l'infra Redis pub/sub du déploiement).
- **Exceptions typées** : `UnknownTemplateError`, `InvalidToolArgsError`, `ConversationNotFound`,
  `ActionNotConfirmable`…

### Use cases (application)
- `SendMessage` : persiste le message user → construit le contexte (historique + **outils dérivés
  du catalogue réel**) → appelle `LLMProvider.stream` → **diffuse les tokens en SSE** *ou* produit
  une `ActionProposal` (si appel d'outil d'action).
- `ConfirmAction` : recharge la proposition, **re-valide**, puis **délègue au use case de déploiement
  existant** (`CreateDeployment` / lifecycle stop·start·regenerate de la slice `deployment`).
  Aucune duplication de la logique de provisioning.
- `RejectAction`.
- CRUD fils : `ListConversations`, `CreateConversation`, `RenameConversation`,
  `DeleteConversation`, `GetConversation`.

### Outils exposés au LLM (tool-calling)
- **Lecture (exécution immédiate, sans risque)** : `list_catalog()`, `get_template(template_id)`,
  `list_my_deployments()`.
- **Action (NE s'exécutent pas — produisent une `ActionProposal` à confirmer)** :
  `deploy_template(template_id, version, params)`, `stop_deployment(deployment_id)`,
  `start_deployment(deployment_id)`, `regenerate_password(deployment_id)`.

### Infrastructure
- Repos SQLAlchemy (`Conversation`, `Message`, `ChatAction`) + **une** migration Alembic
  (tête unique posée par l'agent fondation).
- `infrastructure/llm/` : adaptateurs `OpenAIProvider`, `OllamaProvider`, `AnthropicProvider`
  implémentant le port (traduisent le contrat outils ⇆ format fournisseur, parsent les tool calls)
  + un **`FakeLLMProvider`** déterministe pour les tests (aucun vrai appel LLM en test/CI).
- `infrastructure/tools/` : construction des `ToolDefinition` à partir du catalogue + **gate
  anti-hallucination** (validation stricte des arguments).
- Events Redis réutilisés (canal `chat:{conversation_id}`).

### Présentation
Routers FastAPI + schémas (cf. §5). Le secret n'apparaît jamais dans une réponse LLM ni un log.

## 🎨 Architecture frontend — `apps/web/src/chat/` (Clean Archi, vertical slice)

- **Layout 3 colonnes** (`ChatPage`) :
  - `ConversationsSidebar` — liste / créer / renommer / supprimer / sélectionner (React Query).
  - `MessageList` + `ChatComposer` — bulles de messages, `ActionCard` inline, composer langage
    naturel. **Bouton pièce-jointe (trombone) masqué au MVP.** Disclaimer conservé
    (« StackNest IA peut produire des erreurs »).
  - `ContextAside` — **déploiements actifs en live** (réutilise les hooks/service de la slice
    déploiement) : on chatte, la ressource apparaît à droite.
- **Types** dto / models / enums / guards + mappers (snake_case ⇆ camelCase).
- **Service** `chatService` (REST) + **hooks** : `useConversations`, `useConversation`,
  `useCreateConversation`, `useRenameConversation`, `useDeleteConversation`, `useSendMessage`,
  `useChatStream` (**fetch-SSE + Bearer**, pattern #47), `useConfirmAction`, `useRejectAction`.
- **`ActionCard`** : bandeau de reformulation + récap (template, image figée, params, quotas) +
  `Confirmer` / `Modifier` / `Annuler`. **« Modifier »** préremplit la page de config déploiement
  existante (réutilise `ConfigPage`) — pas de second éditeur.

## 🔌 Contrats API

### REST
| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/chat/conversations` | liste des fils de l'utilisateur |
| `POST` | `/chat/conversations` | crée un fil (`{title?}`) |
| `GET` | `/chat/conversations/{id}` | fil + messages |
| `PATCH` | `/chat/conversations/{id}` | renomme (`{title}`) |
| `DELETE` | `/chat/conversations/{id}` | supprime |
| `POST` | `/chat/conversations/{id}/messages` | envoie un message user → `202` (réponse en SSE) |
| `GET` | `/chat/conversations/{id}/stream` | **SSE** (auth Bearer via fetch-SSE) |
| `POST` | `/chat/actions/{action_id}/confirm` | confirme → délègue au déploiement → `202` |
| `POST` | `/chat/actions/{action_id}/reject` | rejette → `200` |

### Événements SSE (`/chat/conversations/{id}/stream`)
- `token` `{delta}` — fragment de réponse assistant (streaming).
- `message` `{message_id, role, content}` — message complété.
- `action_proposed` `{action_id, kind, proposal:{template_id, version, params, restatement, recap}}`
  — déclenche l'`ActionCard`.
- `action_result` `{action_id, status, deployment_id?}` — après confirmation/exécution.
- `error` `{message}`.

## 🔄 Flux de bout en bout

**Cas 1 — conseil / question** : message user → `SendMessage` → LLM (avec outils lecture +
contexte catalogue) → tokens streamés en SSE → bulle qui se remplit.

**Cas 2 — action** : message user → LLM émet un appel d'outil d'action → **gate** (validation des
args vs catalogue) → `ActionProposal` → event `action_proposed` → `ActionCard` (reformulation) →
l'utilisateur **confirme** → `POST /chat/actions/{id}/confirm` → **use case Déploiement existant** →
worker provisionne → `action_result` + la ressource apparaît dans l'`aside` live et dans
`/deployments`.

## 🛡️ Sécurité & honnêteté (anti-hallucination — défense en profondeur)

1. **Boîte à outils fermée** — le LLM ne reçoit que la liste réelle des templates ; il ne peut
   référencer qu'eux.
2. **Validation stricte des arguments** — `template_id` / `version` / `param` inexistant ou
   non conforme au schéma du template → rejet + on redemande au LLM de reformuler (retries bornés),
   sinon message honnête « je n'ai pas trouvé ça dans le catalogue ».
3. **Le LLM ne voit jamais un secret** — il propose ; le secret est généré côté worker au
   provisioning et diffusé une seule fois (comme aujourd'hui).
4. **Rien ne s'exécute sans confirmation explicite** — la carte montre exactement ce qui va tourner.
5. **Garde-fous métier** — refus hors catalogue, plafonds cpu/mém, **budget de tokens / rate-limit**
   par utilisateur (maîtrise du coût LLM — point soulevé en revue prof).

Couche optionnelle V2 : un **2ᵉ LLM « juge »** qui relit l'action avant la carte.

## 📦 Périmètre

**Inclus (MVP)** : assistant guidé + confirmation ; actions deploy/stop/start/regenerate ;
tool-calling + 5 couches ; confirmation avancée ; port `LLMProvider` + ≥1 adaptateur câblé pour la
démo (+ interface pour les autres) ; fils multiples (CRUD minimal) ; streaming SSE ; layout 3
colonnes ; persistance conversations/messages/actions.

**Hors périmètre (V2)** : `détruire` via chat ; LLM « juge » ; dossiers / recherche / partage de
fils ; pièces jointes ; RAG sur la doc ; voix.

## 🧪 Stratégie de test (TDD strict)

- **LLM mocké partout** — `FakeLLMProvider` déterministe : aucun appel réseau LLM en test/CI.
- **Back unit** : adaptateurs LLM (traduction contrat ⇆ format, parsing tool calls) ; **gate**
  anti-hallucination (rejet template/version/param inconnu) ; cycle `ActionProposal` ;
  `ConfirmAction` délègue bien au use case Déploiement ; repos.
- **Back integ** : endpoints + SSE (envoi message → events ; confirm → déploiement créé) avec
  `FakeLLMProvider`.
- **Front unit** : `ActionCard`, `MessageList`, `ConversationsSidebar`, hooks (`useChatStream` avec
  `@microsoft/fetch-event-source` mocké, `useConfirmAction`), mappers.
- **Front integ** : `ChatPage` (MSW + SSE mocké) — message → bulle streamée → carte → confirme →
  aside mis à jour.
- **E2E** : scénario scripté avec LLM stub déterministe (« déploie postgres » → carte → confirme →
  running).

Couverture : 80 % global / 90 % logique métier (gate, use cases).

## 🤖 Découpage par agent (3 agents + vague de câblage)

Règle anti-collision : **1 dossier = 1 propriétaire** ; **une seule** tête de migration Alembic ;
**un seul** propriétaire du routing front.

### Vague 0 — parallèle (démarrage immédiat, dossiers disjoints)
- **Agent FRONT** — toute la slice `apps/web/src/chat/**` contre un **seam REST + SSE** (fixtures),
  comme le front déploiement. Seul à toucher `core/router.tsx` (+1 ligne, route déjà placeholder).
- **Agent BACK-1 (fondation)** — `apps/api/app/chat/` : domain (entités, VO, enums, **port
  `LLMProvider`**, exceptions) + persistance (repos) + **la migration Alembic** (tête unique) +
  `FakeLLMProvider`. Fixe les contrats consommés par la suite. **À merger en premier.**

### Vague 1 — après merge de BACK-1
- **Agent BACK-2 (moteur)** — adaptateurs LLM (OpenAI/Ollama/Anthropic) + outils dérivés du
  catalogue + **gate anti-hallucination** + use cases (`SendMessage` stream, `ConfirmAction` →
  réutilise le déploiement, CRUD) + présentation (routers + SSE). Seul propriétaire de `chat/` en
  vague 1.

### Vague 2 — tech-lead (moi)
- Câblage : choix de l'adaptateur LLM de démo + config/env, branchement du front sur l'API réelle,
  **E2E complet**. Un **agent QA** (read-only, gate + conformité) entre chaque merge, selon le
  pipeline habituel **dev → QA → tech-lead merge**.

Les tickets Jira (épic STN-4) seront créés via `/ba` (Phase B) en miroir de ce découpage.

## ⚠️ Risques & mitigations

| Risque | Mitigation |
|---|---|
| Tool-calling fragile sur petit modèle Ollama | Port agnostique + adaptateur fiable (OpenAI/Claude) câblé pour la démo ; Ollama documenté/optionnel. |
| Coût / abus LLM | Rate-limit + budget de tokens par utilisateur ; outils en lecture peu coûteux ; garde-fous métier. |
| Hallucination d'action | Boîte à outils fermée + validation stricte des args + confirmation obligatoire (5 couches). |
| Tête de migration Alembic | BACK-1 pose la tête unique et merge avant BACK-2 (sérialisation). |
| Collision routing front | FRONT seul propriétaire de `router.tsx`. |
| Auth du SSE chat | Réutilise le pattern fetch-SSE + Bearer + refresh-on-401 déjà validé (#47). |
