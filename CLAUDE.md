# Monest — Budget App

## Stack
- React 19 + Vite 7 (SWC) + Tailwind CSS 4
- Zustand (state) + date-fns (dates) + Recharts (charts)
- Motion (animations) + Sonner (toasts) + Lucide (icons)
- PWA via vite-plugin-pwa (Workbox)

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run test` — 79 unit tests (Vitest)
- `npm run lint` — ESLint

## Architecture
```
src/
  components/
    ui/          — Card, Button, Input, Select, Modal, AnimatedNumber, ProgressBar, Skeleton
    layout/      — AppShell (bottom nav)
    onboarding/  — OnboardingWizard
    ErrorBoundary.jsx
  pages/         — DashboardPage, MonthlyPage, ChargesPage, CalendarPage, ImportPage, SettingsPage
  stores/        — householdStore, chargesStore (+ auto-categorisation), monthlyStore (Zustand + persist)
  utils/         — calculations, csvParser, format, insights, motion
```

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
