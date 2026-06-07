import { describe, expect, it } from 'vitest'

import { toAuthUser } from '../userMapper'
import type { UserDto } from '../../types/dto/UserDto'

describe('userMapper — toAuthUser', () => {
  const baseDto: UserDto = {
    id: 'usr_1',
    email: 'alice@stacknest.dev',
    role: 'user',
    is_verified: true,
  }

  it('mappe les champs DTO vers le modèle UI (snake_case → camelCase)', () => {
    const user = toAuthUser(baseDto)

    expect(user).toEqual({
      id: 'usr_1',
      email: 'alice@stacknest.dev',
      role: 'user',
      isVerified: true,
      isAdmin: false,
    })
  })

  it('dérive isAdmin=true pour un rôle admin', () => {
    const user = toAuthUser({ ...baseDto, role: 'admin' })

    expect(user.role).toBe('admin')
    expect(user.isAdmin).toBe(true)
  })

  it('retombe sur le rôle user et isAdmin=false pour un rôle inconnu', () => {
    const user = toAuthUser({ ...baseDto, role: 'superuser' })

    expect(user.role).toBe('user')
    expect(user.isAdmin).toBe(false)
  })
})
