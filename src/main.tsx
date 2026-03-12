import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

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

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.update())
        })
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
