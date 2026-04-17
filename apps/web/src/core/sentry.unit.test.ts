import { beforeEach, describe, expect, it, vi } from 'vitest'

const { initMock } = vi.hoisted(() => ({ initMock: vi.fn() }))

vi.mock('@sentry/react', () => ({
  init: initMock,
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
}))

import { initSentry } from './sentry'

describe('initSentry', () => {
  beforeEach(() => {
    initMock.mockReset()
  })

  it('initialise Sentry quand le DSN est fourni', () => {
    initSentry({ dsn: 'https://public@sentry.example/1', environment: 'dev' })

    expect(initMock).toHaveBeenCalledOnce()
    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@sentry.example/1',
        environment: 'dev',
      }),
    )
  })

  it('ne fait rien quand le DSN est absent', () => {
    initSentry({ dsn: undefined, environment: 'dev' })

    expect(initMock).not.toHaveBeenCalled()
  })

  it('ne fait rien quand le DSN est vide', () => {
    initSentry({ dsn: '', environment: 'dev' })

    expect(initMock).not.toHaveBeenCalled()
  })
})
