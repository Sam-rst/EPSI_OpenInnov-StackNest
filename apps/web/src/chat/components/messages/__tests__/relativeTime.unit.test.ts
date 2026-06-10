import { describe, expect, it } from 'vitest'

import { relativeTime } from '../relativeTime'

const NOW = new Date('2026-06-10T14:30:00Z')

describe('relativeTime', () => {
  it('affiche « à l’instant » sous une minute', () => {
    expect(relativeTime('2026-06-10T14:29:40Z', NOW)).toBe('à l’instant')
  })

  it('affiche les minutes écoulées', () => {
    expect(relativeTime('2026-06-10T14:27:00Z', NOW)).toBe('il y a 3 min')
  })

  it('affiche les heures écoulées', () => {
    expect(relativeTime('2026-06-10T12:30:00Z', NOW)).toBe('il y a 2 h')
  })

  it('bascule sur l’heure HH:MM au-delà d’un jour', () => {
    // Plus de 24 h : on montre l'heure locale figée plutôt qu'un delta géant.
    const result = relativeTime('2026-06-08T09:05:00Z', NOW)
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('renvoie une chaîne vide pour une date invalide', () => {
    expect(relativeTime('pas-une-date', NOW)).toBe('')
  })
})
