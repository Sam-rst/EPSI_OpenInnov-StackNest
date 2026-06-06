import { describe, expect, it } from 'vitest'

import { toAuthSession } from '../authResponseMapper'
import type { AuthResponseDto } from '../../types/dto/AuthResponseDto'

describe('authResponseMapper — toAuthSession', () => {
  it('mappe la réponse de login vers une session UI (token + user enrichi)', () => {
    const dto: AuthResponseDto = {
      access_token: 'jwt.access.token',
      user: { id: 'usr_2', email: 'bob@stacknest.dev', role: 'admin', is_verified: false },
    }

    const session = toAuthSession(dto)

    expect(session.accessToken).toBe('jwt.access.token')
    expect(session.user).toEqual({
      id: 'usr_2',
      email: 'bob@stacknest.dev',
      role: 'admin',
      isVerified: false,
      isAdmin: true,
    })
  })
})
