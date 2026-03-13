import * as Sentry from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined

export function initSentry() {
  if (!DSN) return

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    release: __APP_VERSION__,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: false }),
    ],
    // Performance: sample 20% of transactions
    tracesSampleRate: 0.2,
    // Session Replay: 5% normal, 100% on error
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    // Only send errors from our domain
    allowUrls: [/monest\.dev/, /localhost/],
    // Ignore common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop',
      'Network request failed',
      'Load failed',
      'Failed to fetch',
      'AbortError',
      'ChunkLoadError',
      /Loading chunk .* failed/,
    ],
    // Strip sensitive data before sending
    beforeSend(event) {
      // Remove localStorage/sessionStorage from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter(
          (b) => !(b.category === 'console' && /password|token|key/i.test(b.message || ''))
        )
      }
      return event
    },
  })
}

/** Tag current user (call after auth) */
export function setSentryUser(id: string | null) {
  if (!DSN) return
  if (id) {
    Sentry.setUser({ id })
  } else {
    Sentry.setUser(null)
  }
}

/** Capture a handled error with extra context */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!DSN) return
  Sentry.captureException(error, { extra: context })
}

export { Sentry }
