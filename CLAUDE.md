# Monest — Budget App

## Stack
- React 19 + Vite 7 (SWC) + Tailwind CSS 4
- Zustand (state) + date-fns (dates) + Recharts (charts)
- Motion (animations) + Sonner (toasts) + Lucide (icons)
- Supabase (auth, database, real-time sync)
- PWA via vite-plugin-pwa (Workbox)

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run test` — 79 unit tests (Vitest)
- `npm run lint` — ESLint

## Architecture
```
src/
  lib/           — supabase client
  hooks/         — useSupabaseSync (auth + real-time sync)
  components/
    ui/          — Card, Button, Input, Select, Modal, AnimatedNumber, ProgressBar, Skeleton
    layout/      — AppShell (bottom nav + FAB)
    auth/        — AuthPage (login/signup/magic link)
    onboarding/  — OnboardingWizard
    QuickAddExpense.jsx — FAB + expense bottom sheet
    ErrorBoundary.jsx
  pages/         — DashboardPage, MonthlyPage, ChargesPage, ExpensesPage, SavingsPage, CalendarPage, ImportPage, SettingsPage
  stores/        — householdStore, chargesStore, monthlyStore, savingsStore, expenseStore (Zustand + persist)
  utils/         — calculations, csvParser, format, insights, motion
```

## Supabase
- Project: monest (soprkrdikstxopuusgfq)
- Region: eu-west-3
- Tables: households, household_members, fixed_charges, installment_payments, planned_expenses, monthly_entries, savings_goals, expenses, category_rules
- RLS enabled on all tables (household-scoped access)
- Real-time enabled for all data tables
- Auth: email/password + magic link

## Conventions
- Functional components only, no classes (except ErrorBoundary)
- Named exports for stores, default exports for components/pages
- Tailwind classes inline, no CSS modules
- `useId()` for accessible label/input pairing
- All buttons with icons only must have `aria-label`
- French UI text, no accents in code identifiers
- Currency: `formatCurrency()` from utils/format
- Store keys prefixed `monest-` (localStorage)
- Color tokens defined in `@theme` block of index.css
- Supabase env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

## Deployment
- Vercel: https://monest.vercel.app
- GitHub: Fz3dev/monest
- Branch: claude/budget-app-mvp-VYlUe
