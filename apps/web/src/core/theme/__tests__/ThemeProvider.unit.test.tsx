import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../ThemeProvider'
import { useTheme } from '../useTheme'
import { THEME_STORAGE_KEY } from '../Theme'

function mockPrefersDark(prefersDark: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: prefersDark }))
}

function Probe() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  )
}

describe('ThemeProvider / useTheme', () => {
  beforeEach(() => {
    mockPrefersDark(false)
  })

  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.unstubAllGlobals()
  })

  it('fournit le thème clair par défaut (système clair, rien stocké)', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })

    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('applique la classe dark sur <html> et persiste lors du toggle', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByRole('button')).toHaveTextContent('light')

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('initialise en dark quand prefers-color-scheme: dark', () => {
    mockPrefersDark(true)

    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('useTheme lève une erreur hors du provider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => renderHook(() => useTheme())).toThrow(/ThemeProvider/)

    errorSpy.mockRestore()
  })
})
