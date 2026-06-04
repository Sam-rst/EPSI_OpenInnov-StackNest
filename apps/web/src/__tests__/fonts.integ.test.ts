import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Contract test du self-hosting des fonts (charte docs/brand/README.md §typo).
 * On verrouille l'import @fontsource (offline-friendly, pas de Google Fonts
 * runtime) des familles Inter (UI) et JetBrains Mono (code) avec les graisses
 * référencées par les tokens --font-sans / --font-mono.
 *
 * Lecture via `fs` : on vérifie la source, pas le bundle compilé par Vite.
 */
const main = readFileSync(resolve(process.cwd(), 'src/main.tsx'), 'utf-8')

describe('self-hosting des fonts (main.tsx)', () => {
  it('charge Inter via @fontsource (graisses 400 à 700)', () => {
    for (const weight of [400, 500, 600, 700]) {
      expect(main).toContain(`@fontsource/inter/${weight}.css`)
    }
  })

  it('charge JetBrains Mono via @fontsource (graisses 400, 500, 700)', () => {
    for (const weight of [400, 500, 700]) {
      expect(main).toContain(`@fontsource/jetbrains-mono/${weight}.css`)
    }
  })
})
