# Chat IA — Élicitation guidée + finitions (design)

> Issu de la séance de fix live du 2026-06-10 (après le fix « Connexion interrompue », PR #61).
> Objectif : rendre le Chat IA réellement **« assistant guidé »** pour le déploiement — il pose
> des questions jusqu'à avoir l'information nécessaire, puis **propose** une config (carte de
> confirmation). Mécanisme **hybride** validé avec Samuel ; modèle inchangé (qwen2.5:3b local).

## 🎯 Problème

La conception Chat IA parlait d'« assistant guidé », mais le **« guidé »** ne désignait que la
**carte de confirmation** (reformulation + Modifier) et les 5 couches anti-hallucination — **pas**
une boucle de recueil du besoin. En l'état :

- Le **prompt système** est minimal (« propose une action ») : il n'invite jamais à poser des
  questions ni à recueillir les paramètres avant de proposer.
- La **gate vérifie déjà la complétude** (`_validate_params` rejette si un param `required` manque ;
  `_require_name` exige le nom), **mais** un appel `deploy_template` incomplet lève
  `InvalidToolArgsException` → `_propose_action` publie un **`error` terminal** → l'utilisateur voit
  « L'assistant n'a pas pu traiter ta demande » **au lieu que l'IA demande l'info manquante**.

Résultat : l'IA propose trop tôt / échoue, et l'utilisateur ne voit jamais la carte de proposition.

## 🛠️ Décision (mécanisme hybride, validé)

« Confiance > 95 % » est ré-exprimé en **complétude déterministe** : l'IA ne peut proposer que
lorsque les champs requis sont réunis. La fiabilité vient de la **structure serveur**, pas de
l'intelligence du modèle → un petit modèle (3B) suffit.

### A — Backend : boucle de clarification + prompt guidé (`apps/api/app/chat/application/send_message.py`)

1. **Boucle au lieu d'impasse (backbone déterministe).** Quand la gate refuse un `deploy_template`
   pour **information manquante** (param `required` absent, nom manquant, version absente), on
   **ré-injecte le feedback** comme message `tool` (« Informations manquantes pour proposer : …
   Demande-les à l'utilisateur ; ne rappelle pas l'outil tant que tu ne les as pas. ») et on
   **continue la passe** (au lieu de publier un `error` terminal). L'IA pose alors la question.
   Borné par `_MAX_TOOL_PASSES` (anti-emballement déjà en place).
   - On distingue ce cas (« clarification nécessaire » → boucle) du cas **hallucination pure**
     (`UnknownTemplateException` : template hors catalogue) qui peut aussi reboucler avec un message
     honnête « ce template n'existe pas dans le catalogue ».
2. **Prompt système d'élicitation guidée.** Réécrit pour : pour un déploiement, d'abord appeler
   `get_template` afin de connaître les paramètres, **poser les questions manquantes (1 à 3 à la
   fois)** — usage, nom, version, params `required` —, **n'appeler `deploy_template` qu'une fois
   tout réuni**, et reformuler l'intention complète dans la proposition. Ne jamais inventer de
   valeur ; en cas de doute, demander.

### C — Frontend : initiales du vrai utilisateur (`apps/web/src/chat/components/messages/`)

`Message.tsx` code en dur `<Avatar name="Vous" />` (initiale « V »). Le remplacer par les initiales
du **vrai utilisateur courant**, via `useCurrentUser()` (déjà câblé sur l'auth réelle,
`name = user.email`), cohérent avec la TopBar. Implémentation : un petit composant `UserAvatar`
(symétrique de `AssistantAvatar`) qui lit `useCurrentUser` et rend `Avatar` avec la bonne couleur.

### B — Affichage de la proposition (vérification, pas de code neuf)

La `ActionCard` existe et est déjà soignée (reformulation + récap + Confirmer/Modifier/Annuler) et
est rendue dès que `message.action` est présent. Elle n'apparaissait pas car le modèle n'émettait
jamais `action_proposed`. **A** corrige la cause. → **vérification live** que la carte s'affiche
bien après une élicitation complète. Le fallback C2 (`DeploymentActionCta`) couvre le cas d'un
petit modèle qui décrirait l'action en JSON brut.

## 🧪 Tests (TDD strict, `FakeLLMProvider` scripté)

- **Back unit** (`SendMessage` avec `FakeLLMProvider`) :
  - `deploy_template` incomplet (param requis manquant) → **pas** d'event `error` terminal ; le
    message `tool` de feedback est ré-injecté et l'IA conclut par un message texte (question).
  - tour suivant avec args complets → event `action_proposed` (proposition).
  - template inconnu → feedback honnête rebouclé (pas de carte).
  - garde-fou : la boucle reste bornée (`_MAX_TOOL_PASSES`), pas de rappel d'outil infini.
- **Front unit** : `UserAvatar` rend les initiales de l'utilisateur courant ; `Message` (user)
  utilise `UserAvatar` (plus de « Vous » codé en dur).
- **Gate verte** back (`uv run pytest -m unit/integ`) + front (typecheck/lint/format/test/build).

## 📦 Périmètre

- **Inclus** : A (prompt + boucle de clarification) ; C (initiales) ; vérif B live.
- **Hors périmètre** : rendre `POST /messages` asynchrone (dette déjà tracée) ; LLM « juge » (V2) ;
  schéma de slots multi-tours persistant (le besoin est porté par l'historique de conversation +
  la gate, pas un état dédié). Modèle inchangé (qwen 3b).

## ⚠️ Risques

| Risque | Mitigation |
|---|---|
| Petit modèle qui rappelle l'outil en boucle au lieu de demander | Feedback explicite « ne rappelle pas l'outil, demande à l'utilisateur » + borne `_MAX_TOOL_PASSES`. |
| Modèle qui invente des valeurs de params | Prompt « ne jamais inventer, demander » + gate revalide à la proposition ET à la confirmation. |
| Latence (tours multiples = plusieurs allers-retours LLM) | Inhérent au 3B CPU ; hors périmètre (cf. dette warmth/async). |
