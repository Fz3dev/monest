import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Nuke stale SW + caches — used by auto-recovery and ?reset
async function nukeAndReload() {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations() || []
    await Promise.all(regs.map(r => r.unregister()))
    const keys = await caches.keys()
    await Promise.all(keys.map(k => caches.delete(k)))
  } catch { /* ignore */ }
  window.location.reload()
}

// ?reset in URL → nuke service worker + caches and reload clean
if (window.location.search.includes('reset')) {
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
  // Auto-catch stale chunk errors (Failed to fetch dynamically imported module)
  // If the SW served old HTML referencing dead chunk hashes, this fires
  window.addEventListener('error', (e) => {
    if (e.message?.includes('Failed to fetch dynamically imported module') ||
        e.message?.includes('Loading chunk') ||
        e.message?.includes('Loading CSS chunk')) {
      // Only auto-retry once per session to avoid infinite loop
      if (!sessionStorage.getItem('monest-chunk-retry')) {
        sessionStorage.setItem('monest-chunk-retry', '1')
        nukeAndReload()
      }
    }
  })

  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason?.message || ''
    if (msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Loading chunk') ||
        msg.includes('Loading CSS chunk')) {
      if (!sessionStorage.getItem('monest-chunk-retry')) {
        sessionStorage.setItem('monest-chunk-retry', '1')
        nukeAndReload()
      }
    }
  })

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => {
        // Auto-reload when new SW activates
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
        // Check for update now
        reg.update()
      })
    })

    // Re-check for SW updates when app comes back to foreground (mobile)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.update())
        })
      }
    })
  }

  // Clear retry flag on successful load
  window.addEventListener('load', () => {
    sessionStorage.removeItem('monest-chunk-retry')
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
