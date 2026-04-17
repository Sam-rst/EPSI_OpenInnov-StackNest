import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from './ui.store'

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ sidebarOpen: false })
  })

  it('toggleSidebar bascule l"etat', () => {
    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarOpen).toBe(true)

    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarOpen).toBe(false)
  })

  it('setSidebarOpen fixe l"etat a true', () => {
    useUiStore.getState().setSidebarOpen(true)
    expect(useUiStore.getState().sidebarOpen).toBe(true)
  })

  it('setSidebarOpen fixe l"etat a false', () => {
    useUiStore.setState({ sidebarOpen: true })

    useUiStore.getState().setSidebarOpen(false)

    expect(useUiStore.getState().sidebarOpen).toBe(false)
  })

  it('part avec sidebarOpen a false par defaut', () => {
    useUiStore.setState({ sidebarOpen: true })
    useUiStore.setState(useUiStore.getInitialState())

    expect(useUiStore.getState().sidebarOpen).toBe(false)
  })
})
