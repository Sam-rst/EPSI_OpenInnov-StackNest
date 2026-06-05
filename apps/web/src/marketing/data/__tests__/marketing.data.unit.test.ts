import { describe, expect, it } from 'vitest'

import { FEATURES } from '../features.data'
import { FOOTER_COLUMNS } from '../footer.data'
import { HOW_STEPS } from '../howItWorks.data'
import { PERSONAS, PERSONA_AUTOPLAY_MS } from '../personas.data'
import { STACK_BOTTOM, STACK_TOP } from '../stack.data'

describe('Marketing data — structure', () => {
  it('expose 3 personas illustratifs avec un mockup typé', () => {
    expect(PERSONAS).toHaveLength(3)
    for (const persona of PERSONAS) {
      expect(['student', 'senior', 'lead']).toContain(persona.mockup)
      expect(persona.bullets.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('expose 3 étapes "comment ça marche" numérotées', () => {
    expect(HOW_STEPS).toHaveLength(3)
    expect(HOW_STEPS.map((step) => step.number)).toEqual(['01', '02', '03'])
  })

  it('expose 4 features clés avec un rendu interne typé', () => {
    expect(FEATURES).toHaveLength(4)
    expect(FEATURES.map((feature) => feature.kind)).toEqual(['catalog', 'chat', 'tf', 'logs'])
  })

  it('expose deux rangées de stack technique non vides', () => {
    expect(STACK_TOP.length).toBeGreaterThan(0)
    expect(STACK_BOTTOM.length).toBeGreaterThan(0)
  })

  it('expose des colonnes de footer non vides', () => {
    expect(FOOTER_COLUMNS.length).toBeGreaterThan(0)
    for (const column of FOOTER_COLUMNS) {
      expect(column.links.length).toBeGreaterThan(0)
    }
  })

  it('définit un délai de défilement automatique des personas positif', () => {
    expect(PERSONA_AUTOPLAY_MS).toBeGreaterThan(0)
  })
})

describe('Marketing data — honnêteté (CA5)', () => {
  it("n'invente aucune métrique sociale chiffrée (ex. nombre d'entreprises / déploiements)", () => {
    const corpus = JSON.stringify({ FEATURES, HOW_STEPS, PERSONAS, STACK_TOP, STACK_BOTTOM })
    expect(corpus).not.toMatch(/\d[\d\s .,]*\s*(entreprises|clients|utilisateurs|déploiements)/i)
    expect(corpus).not.toMatch(/utilisé par/i)
  })

  it("n'invente aucun logo client / témoignage nominatif", () => {
    const corpus = JSON.stringify({ FEATURES, HOW_STEPS, PERSONAS, FOOTER_COLUMNS })
    expect(corpus).not.toMatch(/témoignage|avis client|ils nous font confiance/i)
  })
})
