import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error) {
    // Auto-recover from stale chunk errors
    const msg = error?.message || ''
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Loading CSS chunk') ||
      msg.includes('ChunkLoadError')
    ) {
      if (!sessionStorage.getItem('monest-chunk-retry')) {
        sessionStorage.setItem('monest-chunk-retry', '1')
        ;(async () => {
          try {
            const regs = await navigator.serviceWorker?.getRegistrations() || []
            await Promise.all(regs.map(r => r.unregister()))
            const keys = await caches.keys()
            await Promise.all(keys.map(k => caches.delete(k)))
          } catch { /* ignore */ }
          window.location.reload()
        })()
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">!</div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Oups, une erreur</h1>
            <p className="text-text-secondary text-sm mb-6">
              Quelque chose s'est mal passé. Essayez de recharger la page.
            </p>
            <button
              onClick={async () => {
                try {
                  const regs = await navigator.serviceWorker?.getRegistrations() || []
                  await Promise.all(regs.map(r => r.unregister()))
                  const keys = await caches.keys()
                  await Promise.all(keys.map(k => caches.delete(k)))
                } catch { /* ignore */ }
                window.location.reload()
              }}
              className="bg-brand hover:bg-brand-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              Recharger
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
