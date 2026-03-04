import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useHouseholdStore } from './stores/householdStore'
import AppShell from './components/layout/AppShell'
import ErrorBoundary from './components/ErrorBoundary'
import OnboardingWizard from './components/onboarding/OnboardingWizard'
import { Toaster } from 'sonner'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const MonthlyPage = lazy(() => import('./pages/MonthlyPage'))
const ChargesPage = lazy(() => import('./pages/ChargesPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const ImportPage = lazy(() => import('./pages/ImportPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

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

export default function App() {
  const household = useHouseholdStore((s) => s.household)

  if (!household) {
    return (
      <ErrorBoundary>
        <OnboardingWizard />
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
              <Route path="/mensuel" element={<MonthlyPage />} />
              <Route path="/charges" element={<ChargesPage />} />
              <Route path="/calendrier" element={<CalendarPage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/parametres" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppShell>
        <Toaster theme="dark" position="top-center" richColors />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
