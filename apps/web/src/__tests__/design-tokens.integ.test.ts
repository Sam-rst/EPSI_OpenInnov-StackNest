import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Contract test des tokens sémantiques (charte docs/brand/README.md §3).
 * Les valeurs CSS sont déclaratives : on verrouille le contrat clair/sombre
 * (présence + valeurs) sur lequel s'appuient tous les composants.
 *
 * Lecture via `fs` (et non `import ?raw`) : le plugin @tailwindcss/vite
 * intercepte les imports `.css` et renvoie du CSS compilé/vide, jamais la source.
 */
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf-8')
const normalized = css.toLowerCase()

const LIGHT_TOKENS: Record<string, string> = {
  surface: '#f7f5f0',
  'surface-elevated': '#ffffff',
  'surface-sunken': '#ebe7dc',
  border: '#d9d4c5',
  'border-strong': '#b9b29d',
  'text-primary': '#032233',
  'text-secondary': '#4a5e6e',
  'text-muted': '#7d8a96',
  'text-inverse': '#fffefa',
  'code-bg': '#f1ede1',
  hairline: '#e8e2d2',
}

const DARK_TOKENS: Record<string, string> = {
  surface: '#032233',
  'surface-elevated': '#073047',
  'surface-sunken': '#021824',
  border: '#0d3e57',
  'border-strong': '#15979d',
  'text-primary': '#fffefa',
  'text-secondary': '#c7d4dd',
  'text-muted': '#94aabb',
  'text-inverse': '#021824',
  'code-bg': '#021824',
  hairline: '#0a334a',
}

describe('tokens sémantiques (index.css)', () => {
  it('active la stratégie dark par classe (.dark)', () => {
    expect(normalized).toContain('@custom-variant dark')
    expect(normalized).toContain('.dark')
  })

  it('déclare les 11 tokens sémantiques du thème clair', () => {
    for (const [token, value] of Object.entries(LIGHT_TOKENS)) {
      expect(normalized).toContain(`--${token}: ${value}`)
    }
  })

  it('surcharge les 11 tokens sémantiques pour le thème sombre', () => {
    for (const [token, value] of Object.entries(DARK_TOKENS)) {
      expect(normalized).toContain(`--${token}: ${value}`)
    }
  })

  it('mappe les tokens vers des utilitaires Tailwind via @theme inline', () => {
    expect(normalized).toContain('@theme inline')
    expect(normalized).toContain('--color-surface: var(--surface)')
    expect(normalized).toContain('--color-text-primary: var(--text-primary)')
    expect(normalized).toContain('--color-border: var(--border)')
  })

  it('expose les nuances cyan de la charte', () => {
    expect(normalized).toContain('--color-cyan-500: #15979d')
    expect(normalized).toContain('--color-cyan-600: #0d9297')
    expect(normalized).toContain('--color-cyan-700: #017b86')
  })
})
