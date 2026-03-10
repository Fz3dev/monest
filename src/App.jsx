import { lazy, Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useHouseholdStore } from './stores/householdStore'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { useSupabaseSync } from './hooks/useSupabaseSync'
import AppShell from './components/layout/AppShell'
import ErrorBoundary from './components/ErrorBoundary'
import OnboardingWizard from './components/onboarding/OnboardingWizard'
import AuthPage from './components/auth/AuthPage'
import { Toaster } from 'sonner'

// Lazy import with auto-recovery: if chunk fails (stale cache), nuke SW & reload
function lazyRetry(importFn) {
  return lazy(() =>
    importFn().catch(async () => {
      if (!sessionStorage.getItem('monest-chunk-retry')) {
        sessionStorage.setItem('monest-chunk-retry', '1')
        try {
          const regs = await navigator.serviceWorker?.getRegistrations() || []
          await Promise.all(regs.map(r => r.unregister()))
          const keys = await caches.keys()
          await Promise.all(keys.map(k => caches.delete(k)))
        } catch (e) { /* ignore */ }
        window.location.reload()
        return new Promise(() => {}) // never resolves — page is reloading
      }
      sessionStorage.removeItem('monest-chunk-retry')
      throw new Error('Erreur de chargement — veuillez recharger la page')
    })
  )
}

const DashboardPage = lazyRetry(() => import('./pages/DashboardPage'))
const MonthlyPage = lazyRetry(() => import('./pages/MonthlyPage'))
const ChargesPage = lazyRetry(() => import('./pages/ChargesPage'))
const CalendarPage = lazyRetry(() => import('./pages/CalendarPage'))
const ImportPage = lazyRetry(() => import('./pages/ImportPage'))
const SettingsPage = lazyRetry(() => import('./pages/SettingsPage'))
const SavingsPage = lazyRetry(() => import('./pages/SavingsPage'))
const ExpensesPage = lazyRetry(() => import('./pages/ExpensesPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="text-center py-20">
      <div className="text-6xl font-bold text-text-muted mb-4">404</div>
      <p className="text-text-secondary">Cette page n'existe pas.</p>
    </div>
  )
}

function getInviteCode() {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('invite')
  if (fromUrl) {
    // Persist invite code so it survives email confirmation/magic link redirects
    localStorage.setItem('monest-invite-code', fromUrl)
    return fromUrl
  }
  return localStorage.getItem('monest-invite-code') || null
}

function clearInviteCode() {
  localStorage.removeItem('monest-invite-code')
  window.history.replaceState({}, '', window.location.pathname)
}

function AppContent({ session }) {
  const household = useHouseholdStore((s) => s.household)
  const { loadFromSupabase, createHousehold, acceptInvite, syncItem, deleteItem, syncMonthlyEntry, saveHousehold, createInvite } = useSupabaseSync(session)
  const [loading, setLoading] = useState(!!session)
  const [inviteCode] = useState(getInviteCode)

  useEffect(() => {
    if (!session) return

    const init = async () => {
      const hId = await loadFromSupabase()

      // If no household but has invite code, try to join
      if (!hId && inviteCode) {
        await acceptInvite(inviteCode)
      }
      // Clean up invite code from localStorage and URL
      clearInviteCode()
      setLoading(false)
    }

    init()
  }, [session, loadFromSupabase, inviteCode, acceptInvite])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!household) {
    return (
      <ErrorBoundary>
        <OnboardingWizard onComplete={createHousehold} />
        <Toaster theme="dark" position="top-center" richColors />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/mensuel" element={<MonthlyPage syncMonthlyEntry={syncMonthlyEntry} />} />
              <Route path="/charges" element={<ChargesPage syncItem={syncItem} deleteItem={deleteItem} />} />
              <Route path="/depenses" element={<ExpensesPage />} />
              <Route path="/epargne" element={<SavingsPage syncItem={syncItem} deleteItem={deleteItem} />} />
              <Route path="/calendrier" element={<CalendarPage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/parametres" element={<SettingsPage session={session} saveHousehold={saveHousehold} createInvite={createInvite} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppShell>
        <Toaster theme="dark" position="top-center" richColors />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured())

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  // If Supabase is configured, require auth
  if (isSupabaseConfigured() && !session) {
    return (
      <ErrorBoundary>
        <AuthPage inviteCode={getInviteCode()} />
        <Toaster theme="dark" position="top-center" richColors />
      </ErrorBoundary>
    )
  }

  return <AppContent session={session} />
}
