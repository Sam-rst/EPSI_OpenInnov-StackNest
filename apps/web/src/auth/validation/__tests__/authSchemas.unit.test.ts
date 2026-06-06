import { describe, expect, it } from 'vitest'

import { forgotSchema, loginSchema, registerSchema, resetSchema } from '../authSchemas'

describe('authSchemas — loginSchema', () => {
  it('accepte un email valide et un mot de passe non vide', () => {
    const result = loginSchema.safeParse({ email: 'alice@stacknest.dev', password: 'secret' })
    expect(result.success).toBe(true)
  })

  it('rejette un email mal formé', () => {
    const result = loginSchema.safeParse({ email: 'pas-un-email', password: 'secret' })
    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe vide', () => {
    const result = loginSchema.safeParse({ email: 'alice@stacknest.dev', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('authSchemas — registerSchema', () => {
  it('accepte un mot de passe de 8+ caractères avec au moins un chiffre', () => {
    const result = registerSchema.safeParse({
      email: 'alice@stacknest.dev',
      password: 'motdepasse1',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un mot de passe trop court (< 8)', () => {
    const result = registerSchema.safeParse({ email: 'alice@stacknest.dev', password: 'court1' })
    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe sans chiffre', () => {
    const result = registerSchema.safeParse({
      email: 'alice@stacknest.dev',
      password: 'sanschiffre',
    })
    expect(result.success).toBe(false)
  })
})

describe('authSchemas — forgotSchema', () => {
  it('accepte un email valide', () => {
    expect(forgotSchema.safeParse({ email: 'alice@stacknest.dev' }).success).toBe(true)
  })

  it('rejette un email manquant', () => {
    expect(forgotSchema.safeParse({ email: '' }).success).toBe(false)
  })
})

describe('authSchemas — resetSchema', () => {
  it('accepte un mot de passe conforme à la politique', () => {
    const result = resetSchema.safeParse({ password: 'nouveaupass1' })
    expect(result.success).toBe(true)
  })

  it('rejette un mot de passe trop court', () => {
    expect(resetSchema.safeParse({ password: 'abc1' }).success).toBe(false)
  })
})
