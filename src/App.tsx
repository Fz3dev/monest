import { lazy, Suspense, useState, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useHouseholdStore } from './stores/householdStore'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { useSupabaseSync } from './hooks/useSupabaseSync'
import AppShell from './components/layout/AppShell'
import ErrorBoundary from './components/ErrorBoundary'
import OnboardingWizard from './components/onboarding/OnboardingWizard'
import AuthPage from './components/auth/AuthPage'
import ResetPasswordPage from './components/auth/ResetPasswordPage'
import { Toaster, toast } from 'sonner'
import { setSentryUser } from './lib/sentry'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { DashboardSkeleton, ExpensesSkeleton, ChargesSkeleton, MonthlySkeleton, SavingsSkeleton } from './components/ui/Skeleton'
import InstallPrompt from './components/InstallPrompt'
import type { Session } from '@supabase/supabase-js'


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyRetry(importFn: () => Promise<{ default: React.ComponentType<any> }>) {
  return lazy(() =>
    importFn().catch(async () => {
      if (!sessionStorage.getItem('monest-chunk-retry')) {
        sessionStorage.setItem('monest-chunk-retry', '1')
        try {
          const regs = await navigator.serviceWorker?.getRegistrations() || []
          await Promise.all(regs.map(r => r.unregister()))
          const keys = await caches.keys()
          await Promise.all(keys.map(k => caches.delete(k)))
        } catch { /* ignore */ }
        window.location.reload()
        return new Promise<never>(() => {})
      }
      sessionStorage.removeItem('monest-chunk-retry')
      throw new Error('Erreur de chargement — veuillez recharger la page')
    })
  )
}

const LandingPage = lazyRetry(() => import('./pages/LandingPage'))
const PrivacyPage = lazyRetry(() => import('./pages/PrivacyPage'))
const TermsPage = lazyRetry(() => import('./pages/TermsPage'))
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

function getInviteCode(): string | null {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('invite')
  if (fromUrl) {
    localStorage.setItem('monest-invite-code', fromUrl)
    return fromUrl
  }
  return localStorage.getItem('monest-invite-code') || null
}

function clearInviteCode(): void {
  localStorage.removeItem('monest-invite-code')
  window.history.replaceState({}, '', window.location.pathname)
}

interface ProtectedRouteProps {
  session: Session | null
  children: ReactNode
}

function ProtectedRoute({ session, children }: ProtectedRouteProps) {
  const location = useLocation()
  if (isSupabaseConfigured() && !session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

interface AppContentProps {
  session: Session | null
}

function AppContent({ session }: AppContentProps) {
  const household = useHouseholdStore((s) => s.household)
  const { loadFromSupabase, createHousehold, acceptInvite, saveHousehold, createInvite, memberCount } = useSupabaseSync(session)
  const [loading, setLoading] = useState(!!session)
  const [inviteCode] = useState(getInviteCode)
  const navigate = useNavigate()

  useEffect(() => {
    if (!session) return

    const init = async () => {
      const hId = await loadFromSupabase()

      if (!hId && inviteCode) {
        const result = await acceptInvite(inviteCode)
        if (result && 'error' in result) {
          const messages: Record<string, string> = {
            not_found: 'Cette invitation est invalide ou a déjà été utilisée.',
            expired: 'Cette invitation a expiré.',
            invalid_code: 'Code d\'invitation invalide.',
            join_failed: 'Impossible de rejoindre le foyer.',
          }
          toast.error(messages[result.error as string] || 'Erreur lors de l\'acceptation de l\'invitation.')
        } else if (result && 'householdId' in result) {
          toast.success('Vous avez rejoint le foyer !')
        }
      }
      clearInviteCode()
      setLoading(false)
    }

    init()
  }, [session, loadFromSupabase, inviteCode, acceptInvite])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('share') === 'true') {
      const text = params.get('text') || params.get('title') || ''
      const match = text.match(/(\d+[.,]?\d*)/)
      if (match) {
        const amount = parseFloat(match[1].replace(',', '.'))
        navigate('/depenses', { state: { sharedAmount: amount }, replace: true })
      } else {
        navigate('/depenses', { replace: true })
      }
      window.history.replaceState({}, '', '/depenses')
    }
  }, [navigate])

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
      </ErrorBoundary>
    )
  }

  return (
    <AppShell memberCount={memberCount}>
      <Routes>
        <Route path="/dashboard" element={<Suspense fallback={<DashboardSkeleton />}><DashboardPage /></Suspense>} />
        <Route path="/mensuel" element={<Suspense fallback={<MonthlySkeleton />}><MonthlyPage /></Suspense>} />
        <Route path="/charges" element={<Suspense fallback={<ChargesSkeleton />}><ChargesPage /></Suspense>} />
        <Route path="/depenses" element={<Suspense fallback={<ExpensesSkeleton />}><ExpensesPage /></Suspense>} />
        <Route path="/epargne" element={<Suspense fallback={<SavingsSkeleton />}><SavingsPage /></Suspense>} />
        <Route path="/calendrier" element={<Suspense fallback={<PageLoader />}><CalendarPage /></Suspense>} />
        <Route path="/import" element={<Suspense fallback={<PageLoader />}><ImportPage /></Suspense>} />
        <Route path="/parametres" element={<Suspense fallback={<PageLoader />}><SettingsPage session={session} saveHousehold={saveHousehold} createInvite={createInvite} /></Suspense>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <InstallPrompt />
    </AppShell>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(() => isSupabaseConfigured())
  const [passwordRecovery, setPasswordRecovery] = useState(() => {
    if (window.location.hash.includes('type=recovery')) {
      sessionStorage.setItem('monest-password-recovery', '1')
      return true
    }
    return sessionStorage.getItem('monest-password-recovery') === '1'
  })

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSentryUser(s?.user?.id ?? null)
      // In recovery mode, only accept the recovery session — ignore other events
      // that would auto-login with the existing browser session
      if (sessionStorage.getItem('monest-password-recovery') === '1') {
        if (_event === 'PASSWORD_RECOVERY') {
          setSession(s)
          setPasswordRecovery(true)
        }
        return
      }
      setSession(s)
      if (_event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem('monest-password-recovery', '1')
        setPasswordRecovery(true)
      }
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

  if (passwordRecovery && session) {
    return (
      <ErrorBoundary>
        <BrowserRouter>
          <ResetPasswordPage onComplete={() => {
            sessionStorage.removeItem('monest-password-recovery')
            setPasswordRecovery(false)
          }} />
          <Toaster theme="dark" position="bottom-right" richColors />
        </BrowserRouter>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={
              session ? <Navigate to="/dashboard" replace /> : <LandingPage lang="fr" />
            } />
            <Route path="/en" element={
              session ? <Navigate to="/dashboard" replace /> : <LandingPage lang="en" />
            } />
            <Route path="/confidentialite" element={<PrivacyPage />} />
            <Route path="/conditions" element={<TermsPage />} />
            <Route path="/login" element={
              session
                ? <Navigate to="/dashboard" replace />
                : <AuthPage inviteCode={getInviteCode() ?? undefined} />
            } />
            <Route path="/signup" element={
              session
                ? <Navigate to="/dashboard" replace />
                : <AuthPage inviteCode={getInviteCode() ?? undefined} defaultMode="signup" />
            } />

            <Route path="/*" element={
              <ProtectedRoute session={session}>
                <AppContent session={session} />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
        <Toaster theme="dark" position="bottom-right" richColors />
        <Analytics />
        <SpeedInsights />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
