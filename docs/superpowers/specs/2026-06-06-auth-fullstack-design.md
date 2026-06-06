# Auth full-stack — Design (brainstorm validé 2026-06-06)

> Feature : authentification + gestion des utilisateurs + RBAC. Epic **STN-2**.
> Socle DB déjà livré (STN-160). Front shell existe (LoginPage placeholder, bypass `isAuthenticated:true`).

## Décisions verrouillées (brainstorm)

| # | Décision | Choix |
|---|---|---|
| 1 | Politique d'inscription | **Auto-inscription ouverte** (rôle `user` par défaut, 1er admin via CLI `create-admin`) |
| 2 | Stockage tokens front | **Hybride** : access JWT court (~15 min) **en mémoire JS** (header Bearer) + refresh JWT (~7 j) en **cookie httpOnly/Secure/SameSite=Strict** |
| 3 | Révocation refresh | **Stateless + `token_version`** sur `users` (bump = invalide tous les refresh : logout, changement de mot de passe) |
| 4 | Périmètre 1er lot | Cœur **+ rate-limiting login/register + reset mot de passe + vérification email** |
| 5 | Enforcement vérif email | **Flag `AUTH_REQUIRE_EMAIL_VERIFICATION`** : off dev/démo, on test/prod. `create-admin` crée un compte déjà vérifié |

## Modèle de données — table `users` (migration posée dans le SOCLE back)

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `email` | citext / varchar unique | lowercased à l'écriture, index unique |
| `password_hash` | varchar | bcrypt (cost ≥ 12) |
| `role` | enum `user_role` (`user`,`admin`) | défaut `user` |
| `is_verified` | bool | défaut `false` |
| `token_version` | int | défaut `0` — bump révoque refresh + reset |
| `created_at` / `updated_at` | timestamptz | server default now |

**Aucune table annexe.** Refresh / verify / reset = **JWT signés** avec claims `sub`, `purpose` (`refresh`|`verify`|`reset`), `token_version`, `exp`. Single-use garanti par le bump de `token_version` (pour reset) ; verify est idempotent.

## Backend — `apps/api/app/auth/` (Clean Archi, 1 fichier = 1 classe)

> ⚠️ Le **noyau identité/RBAC** (UserModel, UserRepository, JwtTokenService, `get_current_user`, `require_admin`) est posé **dans le socle** (cross-cutting). Le track Auth livre les **flows** + le front.

- **domain/**
  - `entities/User.py` (guards `__post_init__`)
  - `value_objects/Email.py` (frozen, format + lowercase), `value_objects/Password.py` (politique min 8, 1 chiffre…)
  - `enums/UserRole.py`
  - `interfaces/` : `PasswordHasher`, `TokenService`, `UserRepository`, `EmailSender` (réutilise infra STN-34), `Clock`
  - `exceptions/` : `InvalidCredentials`, `EmailAlreadyUsed`, `EmailNotVerified`, `InvalidToken`, `TokenExpired`, `RateLimited` (DomainException : code + message)
- **application/** (1 use case / fichier)
  - `RegisterUser` · `VerifyEmail` · `LoginUser` · `RefreshAccess` · `LogoutUser` · `RequestPasswordReset` · `ResetPassword` · `GetCurrentUser`
- **infrastructure/**
  - `models/UserModel.py` *(socle)* · `repositories/SqlAlchemyUserRepository.py` + `mappers/` *(socle)*
  - `security/BcryptPasswordHasher.py` · `security/JwtTokenService.py` (PyJWT) *(socle)*
  - `email/VerificationEmail.py`, `email/ResetEmail.py` (templates, via STN-34)
  - `ratelimit/RedisRateLimiter.py` (Redis déjà dans le stack)
- **presentation/**
  - `routers/auth_router.py` (`prefix="/auth"`)
  - `schemas/` : requests (`RegisterRequest`, `LoginRequest`, `ForgotRequest`, `ResetRequest`, `VerifyRequest`) + responses (`AuthResponse`, `MeResponse`)
  - `dependencies/get_current_user.py` *(socle)*, `dependencies/require_admin.py` *(socle)*
- **core/** *(socle)* : extension `Settings` (JWT secret, TTLs access/refresh, `AUTH_REQUIRE_EMAIL_VERIFICATION`, cookie name/flags, rate-limit), middleware **CORS `allow_credentials=True` + origine stricte**.
- **CLI** : `app/cli.py` → `create-admin` (admin pré-vérifié).

### Contrats d'API (figés pour le parallélisme front/back via MSW)

| Méthode | Route | Body / Réponse |
|---|---|---|
| POST | `/auth/register` | `{email, password}` → `202` (générique, anti-énumération) ; envoie email verify |
| POST | `/auth/verify` | `{token}` → `204` ; set `is_verified` |
| POST | `/auth/login` | `{email, password}` → `200 {access_token, user}` + `Set-Cookie: refresh=…` |
| POST | `/auth/refresh` | cookie refresh → `200 {access_token}` + nouveau cookie refresh |
| POST | `/auth/logout` | (auth) → `204` ; bump `token_version` + clear cookie |
| GET | `/auth/me` | (auth Bearer) → `200 {id, email, role, is_verified}` |
| POST | `/auth/forgot` | `{email}` → `202` (générique) ; envoie email reset |
| POST | `/auth/reset` | `{token, password}` → `204` ; nouveau hash + bump `token_version` |

`AuthResponse` = `{access_token: str, user: {id, email, role, is_verified}}`.
Rate-limit (Redis) sur `/login`, `/register`, `/forgot` (N tentatives / IP / fenêtre → `429`).

### Flows tokens
- **Login** : vérifie creds (anti-timing même si user absent), refuse si `!is_verified` **et** flag on → body `{access_token, user}` + cookie refresh (`httpOnly, Secure, SameSite=Strict, Path=/auth/refresh`).
- **Refresh** : lit cookie, vérifie sig + exp + `purpose=refresh` + `token_version == user.token_version` → ré-émet access + nouveau cookie refresh.
- **Logout** : bump `token_version` (invalide tous les refresh) + clear cookie.
- **Garde CSRF** : SameSite=Strict (+ en-tête custom `X-Requested-With` exigé sur `/auth/refresh`, optionnel).

## Frontend — `apps/web/src/auth/`

> Routes scaffoldées dans le **socle front** (router gelé). Le track Auth **remplit les pages** + rend l'AuthContext réel + l'intercepteur. Ne touche pas `router.tsx`.

- `types/dto` + `types/models` + `mappers/` (AuthResponse, User)
- `services/auth.api.ts` (axios `withCredentials`) : register/verify/login/refresh/logout/me/forgot/reset
- `core/api` *(socle)* : axios instance + `tokenStore` (access en mémoire). Le track Auth ajoute **l'intercepteur** : attache Bearer ; sur `401` → `/auth/refresh` **une seule fois** → rejoue ; sinon purge + redirige `/login`.
- `contexts/AuthContext.ts` + `providers/AuthProvider.tsx` **réels** : au boot, tente `/auth/refresh` (cookie) → si ok, charge `/auth/me` → `isAuthenticated`. Remplace `defaultAuthValue:{isAuthenticated:true}`.
- `hooks/` : `useLogin`, `useRegister`, `useLogout` (React Query mutations)
- `components/` : `LoginForm`, `RegisterForm`, `ForgotForm`, `ResetForm` (react-hook-form + zod)
- `pages/` : `LoginPage` (réelle), `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `VerifyEmailPage` (lit `?token`, POST le token)
- `shared/components/ProtectedRoute.tsx` : branché sur le vrai `isAuthenticated` + variante `RequireAdmin` (rôle).

## Sécurité (cible cyber)
bcrypt cost ≥ 12 · vérif anti-timing · réponses **anti-énumération** (register/forgot génériques `202`) · rate-limit · cookie httpOnly/Secure/SameSite=Strict · CORS strict (origine + credentials) · secret JWT via env/SOPS · tokens verify/reset en **POST body** (le lien email porte `?token` puis la page POST — pattern standard, token court single-use) · access TTL court.

## Tests (TDD strict)
- **Back** : unit (VOs Email/Password, use cases avec fakes) · integ (repo + endpoints via testcontainers PG + httpx AsyncClient) · e2e (`register→verify→login→refresh→reset`).
- **Front** : unit (mappers, validation zod des forms, `tokenStore`, intercepteur « refresh-once ») · integ (pages via MSW sur les contrats ci-dessus) · e2e Playwright (login).

## Périmètre
**Inclus** : users + RBAC user/admin · register/verify/login/refresh/logout/me/forgot/reset · rate-limit · CLI create-admin · front complet.
**Hors périmètre (plus tard)** : rotation de refresh token + détection de réutilisation (table dédiée) · OAuth/SSO · 2FA · gestion fine des permissions au-delà de user/admin · écran admin de gestion des comptes.

## Découpage tickets (PR QA-testables, ticket ≠ PR)
- **STN-78** étendu : `users` (+ `is_verified`, `token_version`) — **dans le socle**.
- **PR A — Inscription + vérif email** : STN-79/80 (socle) + RegisterUser/VerifyEmail + endpoints + RegisterForm + VerifyEmailPage. QA : créer compte → Mailhog → vérifié.
- **PR B — Login + session + RBAC** : LoginUser/RefreshAccess/LogoutUser/GetCurrentUser + `get_current_user`/`require_admin` (socle) + rate-limit login + AuthContext réel + intercepteur + LoginPage + ProtectedRoute + CLI create-admin. QA : login → dashboard → reste loggé → logout.
- **PR C — Reset mot de passe** : RequestPasswordReset/ResetPassword + endpoints + ForgotForm/ResetForm + pages. QA : forgot → Mailhog → reset → login.
- Nouveaux tickets à créer via `/ba` : verify email, forgot/reset, rate-limit (STN-78→95 ne les couvrent pas tous).
