# Chat IA — Améliorations UX (design + partage agents)

> Issu de la séance de QA live du chat (2026-06-10). Objectif : passer de « démo
> fonctionnelle » à « vrai produit ». Slice concernée : `apps/web/src/chat/`.
> Tout en TDD strict, gate complète, commits FR `STN — [Chat] ...`.

## 🎯 Backlog UX (priorisé)

🔴 P0 (casse le ressenti) · 🟠 P1 (important) · 🟡 P2 (polish). `[QA]` = constaté en live.

### A — Feedback pendant la génération
- 🔴 **A1** Skeleton « l'assistant réfléchit » dès l'envoi (bulle + points animés/shimmer) `[QA : silence total 10-40s]`.
- 🔴 **A4** Auto-scroll en bas à l'envoi + pendant le streaming + bouton « ↓ » si l'utilisateur a remonté `[QA]`.
- 🟠 **A2** Curseur de streaming (bulle qui se remplit, caret clignotant).
- 🟠 **A3** Bouton « Arrêter la génération » pendant le streaming.
- 🟡 **A5** État « envoi… » : bulle user *pending* puis confirmée.

### B — Erreurs
- 🔴 **B1** Affichage d'erreur distinct + contextualisé par type (réseau / timeout LLM / métier-gate / auth), pas un bandeau générique `[QA]`.
- 🔴 **B4** Reconnexion auto du SSE (backoff, pastille « reconnexion ») avant d'afficher une erreur `[QA]`.
- 🟠 **B2** Bouton « Réessayer » (renvoie le dernier message sans le retaper).
- 🟠 **B3** Ne jamais perdre le message si l'envoi échoue.

### C — Rendu du contenu
- 🔴 **C1** Rendu **Markdown** des réponses (gras, listes, blocs de code) `[QA : Markdown brut]`.
- 🟠 **C2** Fallback : si le modèle décrit une action en texte/JSON (petit modèle), afficher un CTA « Configurer ce déploiement » au lieu de JSON brut `[QA]`.

### D — Layout & navigation
- 🟠 **D1** Aside « Déploiements actifs » : filtrer les `destroyed`/SUPPRIMÉ `[QA]`.
- 🟠 **D2** État vide accueillant + suggestions de prompts cliquables.
- 🟡 **D3** Titre de conversation auto (1er message) au lieu de « Nouvelle conversation » `[QA]`.
- 🟡 **D4** Responsive : sidebar/aside repliables sur petit écran.

### E — Robustesse
- 🔴 **E1** Course du 1er message (envoi avant stream ouvert → « connexion perdue ») : garantir l'ordre / file `[QA]`.
- 🟠 **E2** Verrouiller l'envoi pendant une génération en cours.
- 🟡 **E3** Pastille d'état SSE (connecté / reconnexion / hors-ligne).

### F — Accessibilité & polish
- 🟠 **F1** `aria-live` sur le fil (annonce du streaming).
- 🟡 **F2** Focus : refocus composer après envoi ; Échap = annuler.
- 🟡 **F3** Horodatage + avatars cohérents.
- 🟡 **F4** Indicateur discret du modèle (« via Ollama · qwen2.5 »).

## 🔌 Contrat (clé du non-blocage)

`useChatStream` expose un **état riche** consommé par les composants :

```ts
type ChatStreamStatus = 'idle' | 'thinking' | 'streaming' | 'done' | 'error'
type ChatErrorKind   = 'network' | 'timeout' | 'business' | 'auth' | 'unknown'

interface ChatStreamError { kind: ChatErrorKind; message: string }

interface ChatStreamState {
  status: ChatStreamStatus
  streamingText: string                 // texte assistant en cours d'accumulation
  error: ChatStreamError | null
  isReconnecting: boolean
}

interface UseChatStreamResult {
  state: ChatStreamState
  send: (content: string) => void
  stop: () => void
  retry: () => void                      // renvoie le dernier message
  canSend: boolean                       // false pendant thinking/streaming
}
```

`MessageList` (props passées par `ChatPage`) :

```ts
interface MessageListProps {
  messages: Message[]
  streamStatus: ChatStreamStatus
  streamingText: string
  onStop: () => void
}
```

`ChatPage` rend `<ChatError error onRetry isReconnecting/>` et, si fil vide,
`<ChatEmptyState onSuggestion={send}/>`.

## 🤖 Partage des agents (2 vagues, fichiers disjoints)

### Vague 1 — Agent FONDATION (la colonne vertébrale) — merge en premier
Pose le contrat + le câblage + des **stubs** pour que tout compile, afin que la
vague 2 soit 100% disjointe.
- **Possède** : `hooks/useChatStream.ts`, `hooks/useSendMessage.ts`, les **types** du contrat (`types/models/ChatStreamState.ts`), `pages/ChatPage.tsx` (câblage du nouvel état + rendu de `<ChatError>`/`<ChatEmptyState>`/`<MessageList .../>`), `components/messages/MessageList.tsx` (signature props + rendu minimal).
- **Crée des stubs minimaux** (qui compilent, remplis en vague 2) : `components/messages/ThinkingBubble.tsx`, `components/errors/ChatError.tsx`, `components/empty/ChatEmptyState.tsx`.
- **Livre le comportement** : machine d'état (thinking/streaming/done/error+kind), **reconnexion SSE backoff (B4)**, **fix course 1er message (E1)**, **stop (A3-logique)**, **verrou envoi (E2/canSend)**, état connexion (E3), retry (B2-logique), ne pas perdre le message (B3).

### Vague 2 — parallèle (après merge FONDATION), fichiers strictement disjoints
- **Agent MESSAGES** — possède `components/messages/**` (sauf MessageList props déjà fixées) :
  - A1 (remplit `ThinkingBubble`), A2 (curseur/StreamingBubble), A4 (auto-scroll + bouton ↓), A3 (StopButton visuel branché sur `onStop`), C1 (`MarkdownContent`), C2 (CTA fallback action), F3 (horodatage/avatars).
- **Agent SHELL** — possède `components/{sidebar,aside,composer,errors,empty}/**` + indicateur modèle :
  - B1 (remplit `ChatError` : 4 types + design distinct), B2/B3 (bouton Réessayer câblé sur `retry`), D1 (filtre aside), D2 (remplit `ChatEmptyState` + suggestions), D3 (titre auto sidebar), A5 (envoi pending composer), F1 (`aria-live`), F2 (focus/Échap), F4 (indicateur modèle).

**Anti-collision** : `ChatPage.tsx` et la signature de `MessageList` sont **figés en vague 1** → la vague 2 ne les modifie pas. MESSAGES ne touche que `components/messages/**` ; SHELL ne touche que `components/{sidebar,aside,composer,errors,empty}/**`. Zéro fichier partagé entre MESSAGES et SHELL.

### Vague 3 — moi (tech-lead)
QA de chaque PR (pipeline dev→QA→merge), merges sérialisés (FONDATION puis MESSAGES+SHELL), rebuild + **revérif live** avec Samuel.

## 🧪 Tests
TDD strict partout. FONDATION : tests unit de la machine d'état (transitions, reconnexion bornée, course, stop, canSend). MESSAGES/SHELL : tests composants (RTL) + integ `ChatPage` (MSW + SSE mocké) pour les parcours (thinking→streaming→done ; erreur→retry ; vide→suggestion). Gate front 5/5.
