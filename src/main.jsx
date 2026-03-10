import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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
  // SW update handling — auto-reload when new SW activates and check for updates
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

  // Clear chunk retry flag on successful load (set by lazyRetry in App.jsx)
  window.addEventListener('load', () => {
    sessionStorage.removeItem('monest-chunk-retry')
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
