import { describe, expect, it } from 'vitest'

import { parseTags, templateFormSchema } from '../templateFormSchema'

const validValues = {
  slug: 'postgresql-16',
  name: 'PostgreSQL',
  icon: 'database',
  category: 'database',
  provider: 'Docker',
  description: 'Base relationnelle managée, backups & replicas.',
  tags: 'SQL, Persistant',
  popular: true,
}

describe('templateFormSchema', () => {
  it('valide un template correct', () => {
    const result = templateFormSchema.safeParse(validValues)

    expect(result.success).toBe(true)
  })

  it('rejette un slug invalide (majuscules)', () => {
    const result = templateFormSchema.safeParse({ ...validValues, slug: 'PostgreSQL' })

    expect(result.success).toBe(false)
  })

  it('rejette une description trop courte', () => {
    const result = templateFormSchema.safeParse({ ...validValues, description: 'court' })

    expect(result.success).toBe(false)
  })

  it('rejette une catégorie inconnue', () => {
    const result = templateFormSchema.safeParse({ ...validValues, category: 'quantum' })

    expect(result.success).toBe(false)
  })
})

describe('parseTags', () => {
  it('normalise une liste de tags séparés par des virgules', () => {
    expect(parseTags('SQL, Persistant ,  ')).toEqual(['SQL', 'Persistant'])
  })

  it('renvoie un tableau vide pour une chaîne vide', () => {
    expect(parseTags('')).toEqual([])
  })
})
