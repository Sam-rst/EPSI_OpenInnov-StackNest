import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Contract test des métadonnées du document (charte docs/brand/README.md).
 * On verrouille le titre, la tagline, le theme-color de marque, l'og:image,
 * la langue FR et l'absence de dépendance Google Fonts (fonts self-host).
 *
 * Lecture via `fs` : Vite réécrit/injecte le HTML servi, jamais la source.
 */
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8')
const normalized = html.toLowerCase()

describe('métadonnées index.html', () => {
  it('déclare la langue française', () => {
    expect(normalized).toContain('<html lang="fr">')
  })

  it('porte le titre StackNest', () => {
    expect(html).toContain('<title>StackNest</title>')
  })

  it('expose la description avec la tagline de marque', () => {
    expect(normalized).toContain('name="description"')
    expect(html).toContain('Build Fast. Deploy Smart.')
  })

  it('définit le theme-color bleu nuit de la charte', () => {
    expect(normalized).toContain('name="theme-color"')
    expect(normalized).toContain('#032233')
  })

  it('renseigne les métadonnées Open Graph (titre, description, image)', () => {
    expect(normalized).toContain('property="og:title"')
    expect(normalized).toContain('property="og:description"')
    expect(normalized).toContain('property="og:image"')
  })

  it('sert le favicon SVG de marque', () => {
    expect(normalized).toContain('rel="icon"')
    expect(normalized).toContain('favicon.svg')
  })

  it('ne dépend plus de Google Fonts (fonts self-host via @fontsource)', () => {
    expect(normalized).not.toContain('fonts.googleapis.com')
    expect(normalized).not.toContain('fonts.gstatic.com')
  })
})
