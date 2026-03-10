import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log for debugging — chunk errors are handled by lazyRetry() in App.jsx
    // before they reach ErrorBoundary, so no auto-recovery needed here
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">!</div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Oups, une erreur</h1>
            <p className="text-text-secondary text-sm mb-6">
              Quelque chose s'est mal passe. Essayez de recharger la page.
            </p>
            <button
              onClick={async () => {
                try {
                  const regs = await navigator.serviceWorker?.getRegistrations() || []
                  await Promise.all(regs.map(r => r.unregister()))
                  const keys = await caches.keys()
                  await Promise.all(keys.map(k => caches.delete(k)))
                } catch (e) { /* ignore */ }
                sessionStorage.removeItem('monest-chunk-retry')
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
