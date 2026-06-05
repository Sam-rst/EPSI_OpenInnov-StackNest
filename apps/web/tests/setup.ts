import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

// jsdom n'implémente pas matchMedia. Stub par défaut (système clair) pour les
// composants qui lisent prefers-color-scheme (ThemeProvider). Les tests qui ont
// besoin d'un autre comportement le surchargent via vi.stubGlobal.
function createMatchMedia(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }
}

if (typeof window.matchMedia !== 'function') {
  window.matchMedia = createMatchMedia
}

// jsdom n'implémente pas IntersectionObserver. Les animations « whileInView »
// de framer-motion (landing marketing) l'attendent au montage : on fournit un
// stub no-op qui ne déclenche jamais d'intersection (suffisant pour les tests
// de rendu — l'élément reste dans son état initial).
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class IntersectionObserverStub implements IntersectionObserver {
    readonly root: Element | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }
  globalThis.IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
