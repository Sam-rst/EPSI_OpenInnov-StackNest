import { describe, expect, it } from 'vitest'

import { validateDeploymentName } from '../deploymentNameValidation'

describe('validateDeploymentName (label DNS)', () => {
  it('renvoie une erreur explicite quand le nom est vide', () => {
    expect(validateDeploymentName('')).toContain('requis')
    expect(validateDeploymentName('   ')).toContain('requis')
  })

  it('renvoie une erreur de format pour majuscules / espaces / underscore', () => {
    expect(validateDeploymentName('Ma-Base')).toBeDefined()
    expect(validateDeploymentName('ma base')).toBeDefined()
    expect(validateDeploymentName('ma_base')).toBeDefined()
  })

  it('renvoie une erreur quand le nom commence ou finit par un tiret', () => {
    expect(validateDeploymentName('-debut')).toBeDefined()
    expect(validateDeploymentName('fin-')).toBeDefined()
  })

  it('renvoie une erreur quand le nom dépasse 63 caractères', () => {
    expect(validateDeploymentName('a'.repeat(64))).toBeDefined()
  })

  it('accepte un label DNS valide (minuscules, chiffres, tirets internes)', () => {
    expect(validateDeploymentName('ma-base-01')).toBeUndefined()
    expect(validateDeploymentName('pg')).toBeUndefined()
    expect(validateDeploymentName('a'.repeat(63))).toBeUndefined()
  })
})
