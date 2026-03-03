import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useHouseholdStore } from './stores/householdStore'
import AppShell from './components/layout/AppShell'
import OnboardingWizard from './components/onboarding/OnboardingWizard'
import DashboardPage from './pages/DashboardPage'
import MonthlyPage from './pages/MonthlyPage'
import ChargesPage from './pages/ChargesPage'
import CalendarPage from './pages/CalendarPage'
import ImportPage from './pages/ImportPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const household = useHouseholdStore((s) => s.household)

  if (!household) {
    return <OnboardingWizard />
  }

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/mensuel" element={<MonthlyPage />} />
          <Route path="/charges" element={<ChargesPage />} />
          <Route path="/calendrier" element={<CalendarPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/parametres" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
