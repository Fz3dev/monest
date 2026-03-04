# Monest — Budget intelligent de couple

> Mon reste a vivre, simplifie.

Application PWA de gestion de budget pour couples (et solo). Calcul automatique du reste a vivre, repartition des charges, import CSV bancaire, et calendrier previsionnel.

---

## Fonctionnalites

### Dashboard
- **Reste a vivre foyer** en temps reel avec compteur anime
- **Cartes individuelles** avec couleurs personnalisees par personne
- **Pie chart** de repartition des charges par categorie (Recharts)
- **Alertes previsionnelles** sur les 3 prochains mois (echeanciers, depenses planifiees)
- Indicateurs visuels de sante budgetaire (vert / orange / rouge + icones)

### Saisie mensuelle
- Revenus (salaire + remboursements pro) par personne
- Override variable des charges fixes (electricite, etc.)
- **Swipe gauche/droite** pour naviguer entre les mois
- Calcul en temps reel du reste a vivre avec animation

### Charges
Trois types de charges geres :

| Type | Description | Exemple |
|------|-------------|---------|
| **Fixes** | Charges recurrentes (mensuel, bimestriel, trimestriel, annuel) | Loyer, assurance, abonnements |
| **Etalees** | Paiements en N fois avec date de debut | Tennis enfant en 10x, electromenager en 4x |
| **Planifiees** | Depenses ponctuelles a date cible | Vacances, impots |

Chaque charge supporte :
- Attribution : Commun / Personne A / Personne B
- 12 categories (logement, assurance, credit, abonnement, impot, transport, etc.)
- Activation/desactivation sans suppression
- Suppression avec double confirmation
- Mois de debut configurable pour bimestriel/trimestriel
- Decalage de prelevement (M-1, M-2...)

### Repartition des charges
Trois modes de repartition :

| Mode | Fonctionnement |
|------|----------------|
| **50/50** | Partage egal |
| **Pourcentage custom** | Ratio configurable (ex: 60/40, 70/30) |
| **Pro rata** | Calcule automatiquement chaque mois selon les salaires reels |

### Calendrier previsionnel
- Vue sur 12 mois avec code couleur
- Detail au clic : reste a vivre, charges du mois
- Legende visuelle avec icones (accessibilite daltoniens)
- Indicateur de mois charges (echeanciers, depenses planifiees)

### Import CSV bancaire
- **Detection automatique** des colonnes (date, libelle, debit, credit, montant)
- Compatible BoursoBank, et la plupart des banques francaises
- Auto-detection encodage UTF-8 / Latin-1
- Detection des charges recurrentes avec analyse de frequence
- Import selectif : accepter ou ignorer chaque suggestion
- Traitement 100% local (aucun envoi de donnees)

### Reglages
- Modification du foyer (prenoms, couleurs, ratio) apres onboarding
- Export JSON complet du backup
- Import/restauration depuis un fichier JSON
- Reinitialisation avec double confirmation
- Statistiques des donnees (nb charges, mois saisis)

### Onboarding
- Wizard en 3 etapes avec animations
- Choix du modele de comptes (commun+perso, tout commun, tout perso, solo)
- Selection des couleurs par personne
- Configuration du mode de repartition

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | React 19 + Vite 7 (SWC) |
| Style | Tailwind CSS 4 (design tokens via @theme) |
| Etat | Zustand (persist localStorage) |
| Dates | date-fns |
| Charts | Recharts |
| Animations | Motion (framer-motion) |
| Toasts | Sonner |
| Icones | Lucide React |
| PWA | vite-plugin-pwa (Workbox) |
| Tests | Vitest |

---

## Architecture

```
src/
  __tests__/           — Tests unitaires (73 tests)
    calculations.test.js
    csvParser.test.js
    format.test.js
  components/
    ui/                — Card, Button, Input, Select, Modal, AnimatedNumber
    layout/            — AppShell (bottom nav + safe area)
    onboarding/        — OnboardingWizard (3 etapes)
    ErrorBoundary.jsx  — Crash recovery UI
  pages/               — 6 pages lazy-loaded
    DashboardPage      — Vue d'ensemble + pie chart
    MonthlyPage        — Saisie mensuelle + swipe
    ChargesPage        — CRUD 3 types de charges
    CalendarPage       — Grille 12 mois previsionnels
    ImportPage         — Import CSV bancaire
    SettingsPage       — Config foyer + export/import
  stores/              — Zustand + persist + versioning
    householdStore     — Config foyer
    chargesStore       — Charges fixes, etalees, planifiees
    monthlyStore       — Entries mensuelles
  utils/
    calculations.js    — Moteur de calcul budget
    csvParser.js       — Parsing CSV multi-format
    format.js          — Formatage monnaie, dates, constantes
```

---

## Qualite

### Tests
- **73 tests unitaires** couvrant :
  - Moteur de calcul (41 tests) : frequences, pro rata, installments, overrides, solo
  - Parser CSV (15 tests) : colonnes, formats, amounts, grouping
  - Format (17 tests) : monnaie, dates, constantes, payer options

### Accessibilite
- `htmlFor`/`id` sur tous les champs de formulaire (`useId()`)
- `aria-label` sur tous les boutons icones
- `role="dialog"` + `aria-modal` + `Escape` sur les modales
- Pas de `user-scalable=no` (zoom autorise)
- Indicateurs visuels + icones (pas couleur seule) pour daltoniens

### Performance
- SWC au lieu de Babel (build rapide)
- Lazy loading de toutes les pages (`React.lazy`)
- Code splitting automatique
- PWA avec precache Workbox
- `useMemo` pour les calculs couteux
- Animations reduites si `prefers-reduced-motion`

### Design
- Dark mode natif (#0B0B0F)
- Glassmorphism (backdrop-blur)
- Compteurs animes (AnimatedNumber)
- Transitions Spring sur les modales
- Micro-interactions (whileTap scale)
- Safe area pour iPhone (notch)
- Touch targets 44px minimum

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

## Conventions

- Functional components, no classes (sauf ErrorBoundary)
- Named exports pour les stores, default pour les composants/pages
- Tailwind inline, pas de CSS modules
- Texte UI en francais, pas d'accents dans les identifiants
- Store keys prefixes `monest-`
- Couleurs definies dans le bloc `@theme` de index.css
