# Monest — Votre budget, en clair.

> Charges, revenus, epargne, reste a vivre — tout en un. En solo ou en couple, gratuit et prive.

Application PWA de gestion de budget personnel et couple. Calcul automatique du reste a vivre, repartition des charges, import CSV bancaire, notifications push, et bien plus.

**[monest.vercel.app](https://monest.vercel.app)**

---

## Fonctionnalites

### Dashboard
- **Reste a vivre** en temps reel avec compteur anime
- **Cartes individuelles** avec couleurs personnalisees par personne
- **Insights intelligents** — analyses en langage naturel (taux d'epargne, evolution charges, anomalies)
- **Graphique tendance 6 mois** (BarChart reste a vivre vs charges)
- **Repartition par categorie** avec barres de progression et pie chart
- **Badges et streaks** — gamification du suivi budgetaire
- Layout personnalisable (drag & drop des widgets)

### Depenses rapides
- **FAB (bouton flottant)** pour ajouter une depense en 2 secondes
- Categories predefinies avec icones
- Attribution par personne (solo/couple)
- Swipe-to-delete avec undo

### Saisie mensuelle
- Revenus (salaire) par personne
- Override variable des charges fixes
- Swipe gauche/droite pour naviguer entre les mois
- Barre de progression revenus vs charges

### Charges
Trois types de charges geres :

| Type | Description | Exemple |
|------|-------------|---------|
| **Fixes** | Recurrentes (mensuel, bimestriel, trimestriel, annuel) | Loyer, assurance |
| **Etalees** | Paiements en N fois | Tennis enfant en 10x |
| **Planifiees** | Depenses ponctuelles a date cible | Vacances, impots |

- Attribution : Commun / Personne A / Personne B
- 12 categories avec couleurs personnalisables
- Swipe-to-delete, activation/desactivation, edition inline
- Decalage de prelevement configurable

### Epargne
- **Objectifs d'epargne** avec barre de progression
- Icones et couleurs personnalisables
- Echeance optionnelle
- Contributions progressives

### Calendrier previsionnel
- Vue 12 mois avec code couleur
- Detail : reste foyer, charges, repartition par categorie
- Detection des mois charges

### Import CSV bancaire
- Detection automatique des colonnes et de l'encodage
- Auto-categorisation intelligente (50+ mots-cles)
- Apprentissage des corrections utilisateur
- Compatible BoursoBank et la plupart des banques francaises
- Traitement 100% local

### Authentification
- Email / mot de passe
- Lien magique (passwordless)
- **Google OAuth** (Continuer avec Google)
- Mot de passe oublie

### Mode couple
- Invitation par lien/code
- 3 modes de repartition : 50/50, pourcentage custom, pro rata des salaires
- Notifications in-app en temps reel (depenses du partenaire, charges modifiees)
- Synchronisation multi-appareils

### Notifications push
- **Web Push natives** (meme quand l'app est fermee)
- Rappels budget hebdomadaires
- Alertes depenses du partenaire
- Gestion dans Reglages (activer/desactiver)

### PWA
- Installation sur l'ecran d'accueil (Android + iOS)
- Mode hors-ligne avec synchronisation automatique
- Raccourcis (Depenses, Dashboard, Epargne)
- Share target (recevoir du texte partage)
- Guide d'installation adapte par plateforme (iOS Safari, Chrome, Android)

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | React 19 + Vite 7 (SWC) |
| Style | Tailwind CSS 4 (design tokens via @theme) |
| Etat | Zustand (persist localStorage) |
| Backend | Supabase (auth, DB, real-time, Edge Functions) |
| Dates | date-fns |
| Charts | Recharts (PieChart, BarChart) |
| Animations | Motion (framer-motion) |
| Toasts | Sonner |
| Icones | Lucide React |
| PWA | vite-plugin-pwa (injectManifest) |
| Push | Web Push API + VAPID |
| Tests | Vitest (82 tests) |
| Deploy | Vercel |
| Analytics | Vercel Analytics + Speed Insights |

---

## Architecture

```
src/
  sw.js                — Service worker custom (push, cache, periodic sync)
  lib/
    supabase.js        — Client Supabase
    pushSubscription.js — Web Push subscribe/unsubscribe
    notifications.js   — Creation notifications in-app + push trigger
    syncBridge.js      — File d'attente offline
  hooks/
    useSupabaseSync.js — Auth + real-time sync + push sync
    useInstallPrompt.js — Detection plateforme PWA install
  components/
    ui/                — Card, Button, Input, Select, Modal, AnimatedNumber,
                         ProgressBar, Skeleton, SwipeToDelete
    layout/            — AppShell (bottom nav + notification bell)
    auth/              — AuthPage, ResetPasswordPage
    onboarding/        — OnboardingWizard
    InstallPrompt      — Guide install PWA (iOS/Android)
    NotificationBanner — Demande permission push
    QuickAddExpense    — FAB + bottom sheet
  pages/
    LandingPage        — Page d'accueil publique (FR/EN)
    DashboardPage      — Vue d'ensemble + charts + insights
    MonthlyPage        — Saisie mensuelle
    ChargesPage        — CRUD 3 types de charges
    ExpensesPage       — Liste des depenses
    SavingsPage        — Objectifs d'epargne
    CalendarPage       — Previsions 12 mois
    ImportPage         — Import CSV bancaire
    SettingsPage       — Configuration + export/import
    PrivacyPage        — Politique de confidentialite
    TermsPage          — Conditions d'utilisation
  stores/              — Zustand + persist
    householdStore     — Config foyer
    chargesStore       — Charges + regles auto-categorisation
    monthlyStore       — Entries mensuelles
    savingsStore       — Objectifs epargne
    expenseStore       — Depenses rapides
    notificationStore  — Notifications in-app
    dashboardLayoutStore — Layout personnalisable
  utils/
    calculations.js    — Moteur de calcul budget
    csvParser.js       — Parsing CSV multi-format
    format.js          — Formatage monnaie, dates
    insights.js        — Generateur d'insights
    notifications.js   — Permission + rappels hebdo
supabase/
  functions/
    send-push/         — Edge Function envoi push notifications
  migrations/          — DDL (push_subscriptions, etc.)
```

---

## Supabase

- **Tables** : households, household_members, fixed_charges, installment_payments, planned_expenses, monthly_entries, savings_goals, expenses, category_rules, notifications, push_subscriptions
- **RLS** active sur toutes les tables (acces scope par foyer)
- **Real-time** sur toutes les tables de donnees
- **Edge Functions** : `send-push` (envoi notifications push via VAPID)
- **Auth** : email/password, magic link, Google OAuth

---

## Qualite

### Tests
- **82 tests unitaires** couvrant :
  - Moteur de calcul (44 tests) : frequences, pro rata, installments, overrides, solo
  - Parser CSV (15 tests) : colonnes, formats, amounts, grouping
  - Format (17 tests) : monnaie, dates, constantes, payer options
  - Insights (6 tests) : epargne, deficit, comparaison mensuelle

### Accessibilite
- `htmlFor`/`id` sur tous les champs (`useId()`)
- `aria-label` sur tous les boutons icones
- `role="dialog"` + `aria-modal` + `Escape` sur les modales
- `role="button"` + `tabIndex` + `onKeyDown` sur les elements cliquables
- Zoom autorise (pas de `user-scalable=no`)
- Indicateurs visuels + icones (daltoniens)

### Performance
- SWC (build rapide)
- Lazy loading de toutes les pages
- Code splitting (recharts, supabase, motion en chunks separes)
- PWA avec precache Workbox (55 entries)
- Zustand selectors individuels (pas de re-renders inutiles)
- `useMemo` / lazy `useState` init

### Securite
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- `crypto.getRandomValues()` pour les codes d'invitation
- VAPID pour l'authentification push
- RLS Supabase sur toutes les tables
- HTTPS uniquement

---

## Commandes

```bash
npm run dev        # Dev server (HMR)
npm run build      # Build production
npm run test       # Tests unitaires
npm run test:watch # Tests en mode watch
npm run lint       # ESLint
npm run preview    # Preview du build
```

---

## Variables d'environnement

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

Secrets Edge Functions (Supabase Dashboard) :
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

---

## Deploy

- **Vercel** : [monest.vercel.app](https://monest.vercel.app)
- Push sur `main` → deploy automatique
