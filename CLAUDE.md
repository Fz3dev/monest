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

## Design & Branding
- Logo: couronne violette (crown) — PAS un "M" texte
  - `public/logo-crown-sm.png` / `.webp` — logo couronne petit (utilisé dans mockup landing page)
  - `public/logo-crown.png` — logo couronne grande taille
  - `public/logo-full.png` / `.svg` — logo complet (couronne + texte "Monest")
  - `public/logo-icon.svg` — icône seule
  - `public/favicon.svg` — SVG de la couronne (traits violets, fond transparent)
- Favicons/PWA icons: générés via `scripts/generate-favicon.py` — couronne sur fond sombre (#0B0B0F)
  - `favicon.png` (32x32), `apple-touch-icon.png` (180), `pwa-192.png`, `pwa-512.png`
- OG image: générée via `scripts/generate-og-image.py` (1200x630)
- Couleurs principales:
  - Brand violet: #6C63FF `(108, 99, 255)`
  - Background: #0B0B0F `(11, 11, 15)`
  - Card: #16161E `(22, 22, 30)`
  - Vert (épargne): #4ADE80
- Wording: "reste à vivre" (PAS "reste à dépenser"), "en solo ou en couple" (PAS "familial")
- GitHub repo privé — ne PAS afficher de lien GitHub public

## Deployment
- Vercel: https://monest.vercel.app
- GitHub: Fz3dev/monest
- Branch: claude/budget-app-mvp-VYlUe
