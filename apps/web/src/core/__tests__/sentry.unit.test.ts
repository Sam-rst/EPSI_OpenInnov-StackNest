import { beforeEach, describe, expect, it, vi } from 'vitest'

const { initMock } = vi.hoisted(() => ({ initMock: vi.fn() }))

vi.mock('@sentry/react', () => ({
  init: initMock,
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
}))

import { initSentry } from '../sentry'

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

  it('utilise un tracesSampleRate de 0.1 en prod', () => {
    initSentry({ dsn: 'https://public@sentry.example/1', environment: 'prod' })

    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: 'prod',
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
      }),
    )
  })

  it('utilise un tracesSampleRate de 1.0 hors prod', () => {
    initSentry({ dsn: 'https://public@sentry.example/1', environment: 'dev' })

    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tracesSampleRate: 1.0,
      }),
    )
  })

  it("retombe sur 'unknown' si l'environnement est absent", () => {
    initSentry({ dsn: 'https://public@sentry.example/1', environment: undefined })

    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: 'unknown',
      }),
    )
  })

  it('transmet le release au SDK quand fourni', () => {
    initSentry({
      dsn: 'https://public@sentry.example/1',
      environment: 'dev',
      release: 'web@1.2.3',
    })

    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({
        release: 'web@1.2.3',
      }),
    )
  })
})
