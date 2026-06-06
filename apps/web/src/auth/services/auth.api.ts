import { apiClient } from '../../core/api/apiClient'
import type { AuthResponseDto, RefreshResponseDto } from '../types/dto/AuthResponseDto'
import type { UserDto } from '../types/dto/UserDto'
import type {
  CredentialsRequestDto,
  ForgotRequestDto,
  ResetRequestDto,
} from '../types/dto/AuthRequestDto'
import type { AuthSession } from '../types/models/AuthSession'
import type { AuthUser } from '../types/models/AuthUser'
import { toAuthSession } from '../mappers/authResponseMapper'
import { toAuthUser } from '../mappers/userMapper'

/**
 * Couche d'accès HTTP à l'API d'authentification (contrats figés du spec).
 * Toutes les requêtes passent par `apiClient` (axios `withCredentials`) : le
 * Bearer est attaché et le refresh sur 401 est géré par l'intercepteur du client.
 * Les réponses sont mappées en modèles UI avant d'atteindre les hooks/pages.
 */
export const authApi = {
  /** `POST /auth/register` → 202 (réponse générique anti-énumération). */
  async register(credentials: CredentialsRequestDto): Promise<void> {
    await apiClient.post('/auth/register', credentials)
  },

  /** `POST /auth/verify` → 204 ; confirme l'adresse e-mail. */
  async verify(token: string): Promise<void> {
    await apiClient.post('/auth/verify', { token })
  },

  /** `POST /auth/login` → 200 `{ access_token, user }` + cookie refresh. */
  async login(credentials: CredentialsRequestDto): Promise<AuthSession> {
    const { data } = await apiClient.post<AuthResponseDto>('/auth/login', credentials)
    return toAuthSession(data)
  },

  /** `POST /auth/refresh` → 200 `{ access_token }` (cookie refresh renouvelé). */
  async refresh(): Promise<string> {
    const { data } = await apiClient.post<RefreshResponseDto>('/auth/refresh')
    return data.access_token
  },

  /** `POST /auth/logout` → 204 ; bump token_version + clear cookie côté backend. */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },

  /** `GET /auth/me` → 200 ; utilisateur courant (Bearer attaché par l'intercepteur). */
  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<UserDto>('/auth/me')
    return toAuthUser(data)
  },

  /** `POST /auth/forgot` → 202 (réponse générique anti-énumération). */
  async forgot(request: ForgotRequestDto): Promise<void> {
    await apiClient.post('/auth/forgot', request)
  },

  /** `POST /auth/reset` → 204 ; nouveau hash + bump token_version côté backend. */
  async reset(request: ResetRequestDto): Promise<void> {
    await apiClient.post('/auth/reset', request)
  },
}
