import { lazy, Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useHouseholdStore } from './stores/householdStore'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { useSupabaseSync } from './hooks/useSupabaseSync'
import AppShell from './components/layout/AppShell'
import ErrorBoundary from './components/ErrorBoundary'
import OnboardingWizard from './components/onboarding/OnboardingWizard'
import AuthPage from './components/auth/AuthPage'
import InvitePage from './components/invite/InvitePage'
import { Toaster } from 'sonner'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const MonthlyPage = lazy(() => import('./pages/MonthlyPage'))
const ChargesPage = lazy(() => import('./pages/ChargesPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const ImportPage = lazy(() => import('./pages/ImportPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const SavingsPage = lazy(() => import('./pages/SavingsPage'))
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'))

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

function InviteJoin({ session, householdId }) {
  const { joinHousehold, loadFromSupabase } = useSupabaseSync(session)
  const [joining, setJoining] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function doJoin() {
      try {
        const result = await joinHousehold(householdId)
        if (result === 'already_member' || result === 'joined') {
          sessionStorage.removeItem('monest-invite')
          await loadFromSupabase()
          window.location.href = '/'
        } else {
          setError('Impossible de rejoindre ce foyer')
          setJoining(false)
        }
      } catch {
        setError('Une erreur est survenue')
        setJoining(false)
      }
    }
    doJoin()
  }, [householdId, joinHousehold, loadFromSupabase])

  if (joining) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Rejoindre le foyer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-danger mb-4">{error}</p>
        <button onClick={() => window.location.href = '/'} className="text-brand underline">
          Retour a l'accueil
        </button>
      </div>
    </div>
  )
}

function AppContent({ session }) {
  const household = useHouseholdStore((s) => s.household)
  const { loadFromSupabase, createHousehold, joinHousehold, syncItem, deleteItem, syncMonthlyEntry, saveHousehold } = useSupabaseSync(session)
  const [loading, setLoading] = useState(!!session)

  useEffect(() => {
    if (!session) return

    async function init() {
      // Check if user arrived via invite link
      const inviteId = sessionStorage.getItem('monest-invite')
      if (inviteId) {
        const result = await joinHousehold(inviteId)
        if (result === 'joined' || result === 'already_member') {
          sessionStorage.removeItem('monest-invite')
        }
      }
      await loadFromSupabase()
    }

    init().finally(() => setLoading(false))
  }, [session, loadFromSupabase, joinHousehold])

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
              <Route path="/parametres" element={<SettingsPage session={session} saveHousehold={saveHousehold} />} />
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

  // Check if on invite route
  const isInviteRoute = window.location.pathname.startsWith('/invite/')

  if (isInviteRoute) {
    const householdId = window.location.pathname.split('/invite/')[1]
    if (session) {
      return <InviteJoin session={session} householdId={householdId} />
    }
    return (
      <ErrorBoundary>
        <InvitePage householdId={householdId} />
        <Toaster theme="dark" position="top-center" richColors />
      </ErrorBoundary>
    )
  }

  // If Supabase is configured, require auth
  if (isSupabaseConfigured() && !session) {
    return (
      <ErrorBoundary>
        <AuthPage />
        <Toaster theme="dark" position="top-center" richColors />
      </ErrorBoundary>
    )
  }

  return <AppContent session={session} />
}
