import { afterEach, describe, expect, it, vi } from 'vitest'
import { readInitialTheme, THEME_STORAGE_KEY } from '../Theme'

function mockPrefersDark(prefersDark: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: prefersDark }))
}

describe('readInitialTheme', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('retourne la valeur stockée en localStorage si elle est valide', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')

    expect(readInitialTheme()).toBe('dark')
  })

  it('ignore une valeur stockée invalide et retombe sur la préférence système', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'turquoise')
    mockPrefersDark(true)

    expect(readInitialTheme()).toBe('dark')
  })

  it("respecte prefers-color-scheme: dark quand rien n'est stocké", () => {
    mockPrefersDark(true)

    expect(readInitialTheme()).toBe('dark')
  })

  it("retombe sur light quand rien n'est stocké et que le système est clair", () => {
    mockPrefersDark(false)

    expect(readInitialTheme()).toBe('light')
  })
})
