import * as Sentry from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/**
 * Inicializa o Sentry (erros + performance + session replay).
 * No-op sem VITE_SENTRY_DSN — dev local fica desligado até configurar.
 */
export function initSentry() {
  if (!DSN) return

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? 'development',
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      // App financeiro: mascara TODO texto/entrada e bloqueia mídia no replay.
      Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true }),
    ],
    // Performance: liga o trace do front ao backend (mesma request).
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    tracePropagationTargets: [API_URL],
    // Replay: amostra pequena das sessões normais, 100% quando há erro.
    replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE ?? '0.1'),
    replaysOnErrorSampleRate: 1.0,
  })
}

export { Sentry }
