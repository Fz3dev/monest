# Monest — Budget intelligent de couple

> Mon reste a vivre, simplifie.

Application PWA de gestion de budget pour couples (et solo). Calcul automatique du reste a vivre, repartition des charges, import CSV bancaire avec auto-categorisation, insights intelligents, et calendrier previsionnel.

---

## Fonctionnalites

### Dashboard
- **Reste a vivre foyer** en temps reel avec compteur anime
- **Cartes individuelles** avec couleurs personnalisees par personne
- **Taux d'epargne** avec icone tirelire (seuils 10% / 20% / 30%)
- **Insights intelligents** — jusqu'a 3 analyses en langage naturel :
  - Taux d'epargne et recommandations
  - Evolution mensuelle des charges (hausse/baisse)
  - Detection d'anomalies par categorie
  - Alertes mois lourds a venir
- **Graphique tendance 6 mois** (BarChart reste a vivre vs charges)
- **Repartition par categorie** avec barres de progression colorees et pie chart
- Indicateurs de sante budgetaire (vert / orange / rouge + icones)
- Resume revenus / charges / epargne dans la carte hero

### Saisie mensuelle
- Revenus (salaire) par personne
- Override variable des charges fixes (electricite, etc.)
- **Swipe gauche/droite** pour naviguer entre les mois
- **Barre de progression** revenus vs charges
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
- **Swipe gauche pour supprimer** (geste tactile natif)
- Activation/desactivation sans suppression
- Edition inline via modal
- Badges categorie sur chaque charge
- **Carte total mensualise** (somme normalisee de toutes les charges)
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
- **Barre d'intensite de depense** sur chaque mois (relative au max)
- Detail au clic : reste foyer, total charges, repartition par categorie
- **Barres de progression par categorie** dans le detail
- Grille resume (reste foyer + total charges)
- Legende visuelle avec icones (accessibilite daltoniens)
- Indicateur de mois charges (echeanciers, depenses planifiees)

### Import CSV bancaire
- **Detection automatique** des colonnes (date, libelle, debit, credit, montant)
- **Auto-categorisation intelligente** : 50+ mots-cles francais sur 11 categories
- **Apprentissage** : retient les corrections utilisateur pour les futurs imports
- Selecteur de categorie inline sur chaque suggestion
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
| Charts | Recharts (PieChart, BarChart) |
| Animations | Motion (framer-motion) |
| Toasts | Sonner |
| Icones | Lucide React |
| PWA | vite-plugin-pwa (Workbox) |
| Tests | Vitest |

---

## Architecture

```
src/
  __tests__/           — Tests unitaires (79 tests)
    calculations.test.js  (41 tests)
    csvParser.test.js     (15 tests)
    format.test.js        (17 tests)
    insights.test.js      (6 tests)
  components/
    ui/                — Card, Button, Input, Select, Modal, AnimatedNumber,
                         ProgressBar, Skeleton
    layout/            — AppShell (bottom nav + safe area)
    onboarding/        — OnboardingWizard (3 etapes)
    ErrorBoundary.jsx  — Crash recovery UI
  pages/               — 6 pages lazy-loaded
    DashboardPage      — Vue d'ensemble + charts + insights
    MonthlyPage        — Saisie mensuelle + swipe + progress bar
    ChargesPage        — CRUD 3 types + swipe-to-delete
    CalendarPage       — Grille 12 mois + intensite + categories
    ImportPage         — Import CSV + auto-categorisation
    SettingsPage       — Config foyer + export/import
  stores/              — Zustand + persist + versioning
    householdStore     — Config foyer
    chargesStore       — Charges + regles auto-categorisation
    monthlyStore       — Entries mensuelles
  utils/
    calculations.js    — Moteur de calcul budget
    csvParser.js       — Parsing CSV multi-format
    format.js          — Formatage monnaie, dates, constantes
    insights.js        — Generateur d'insights intelligents
    motion.js          — Presets d'animation Motion
```

---

## Qualite

### Tests
- **79 tests unitaires** couvrant :
  - Moteur de calcul (41 tests) : frequences, pro rata, installments, overrides, solo
  - Parser CSV (15 tests) : colonnes, formats, amounts, grouping
  - Format (17 tests) : monnaie, dates, constantes, payer options
  - Insights (6 tests) : epargne, deficit, comparaison mensuelle, max insights

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
- PWA avec precache Workbox (22 entries)
- `useMemo` pour les calculs couteux
- Animations reduites si `prefers-reduced-motion`

### Design
- Dark mode natif (#0B0B0F)
- Glassmorphism (backdrop-blur)
- Compteurs animes (AnimatedNumber)
- Barres de progression animees (ProgressBar)
- Transitions Spring sur les modales
- Micro-interactions (whileTap scale, swipe gestures)
- Skeletons de chargement
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
