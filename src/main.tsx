// Polyfill ReadableStream async iterator for iOS Safari < 26.4
// Must run before ANY library import (pdfjs uses for-await-of on ReadableStream)
if (typeof ReadableStream !== 'undefined' &&
    typeof Symbol.asyncIterator !== 'undefined' &&
    !(Symbol.asyncIterator in ReadableStream.prototype)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(ReadableStream.prototype as any)[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) return
        yield value
      }
    } finally {
      reader.releaseLock()
    }
  }
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initSentry } from './lib/sentry'
import './index.css'

// Init Sentry before anything else
initSentry()

// Suppress unhandled SW registration errors (Chrome iOS / restricted browsers)
// The app works fine without the service worker — these are noise in Sentry
window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e.reason?.message || e.reason || '')
  if (msg.includes('sw.js') || msg.includes('service worker') || msg.includes('ServiceWorker')) {
    e.preventDefault()
  }
})

// Apply saved theme before first paint to avoid flash
;(() => {
  const saved = localStorage.getItem('monest-theme') || 'dark'
  if (saved === 'light') {
    document.documentElement.classList.add('light')
  } else if (saved === 'system') {
    if (!window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('light')
    }
  }
})()
import './i18n'
import './stores/uiStore' // init confidential mode class on <body> before first paint
import App from './App'

// ?reset in URL → nuke service worker + caches and reload clean
if (new URLSearchParams(window.location.search).has('reset')) {
  (async () => {
    try {
      const regs = await navigator.serviceWorker?.getRegistrations() || []
      await Promise.all(regs.map(r => r.unregister()))
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
      localStorage.clear()
    } catch { /* ignore */ }
    window.location.replace(window.location.pathname)
  })()
} else {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                window.location.reload()
              }
            })
          }
        })
        reg.update().catch(() => {})
      })
    }).catch(() => {})

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.update().catch(() => {}))
        }).catch(() => {})
      }
    })
  }

  window.addEventListener('load', () => {
    sessionStorage.removeItem('monest-chunk-retry')
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
