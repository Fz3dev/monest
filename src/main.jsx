import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ?reset in URL → nuke service worker + caches and reload clean
if (window.location.search.includes('reset')) {
  (async () => {
    const regs = await navigator.serviceWorker?.getRegistrations() || []
    await Promise.all(regs.map(r => r.unregister()))
    const keys = await caches.keys()
    await Promise.all(keys.map(k => caches.delete(k)))
    localStorage.clear()
    window.location.replace(window.location.pathname)
  })()
} else if ('serviceWorker' in navigator) {
  // Auto-update: reload when new SW activates
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
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
