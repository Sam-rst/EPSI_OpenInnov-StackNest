import * as Sentry from '@sentry/react'

interface InitSentryOptions {
  dsn: string | undefined
  environment: string | undefined
  release?: string
}

export function initSentry({ dsn, environment, release }: InitSentryOptions): void {
  if (!dsn) {
    return
  }

  Sentry.init({
    dsn,
    environment: environment ?? 'unknown',
    release,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: environment === 'prod' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  })
}
