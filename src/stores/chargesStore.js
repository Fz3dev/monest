import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const generateId = () => crypto.randomUUID()

const CATEGORY_PATTERNS = {
  logement: ['LOYER', 'BAIL', 'RESIDENCE', 'FONCIER', 'HABITATION', 'SYNDIC', 'COPROPRIETE'],
  assurance: ['ASSURANCE', 'MAIF', 'MAAF', 'AXA', 'GROUPAMA', 'ALLIANZ', 'MATMUT', 'MACIF', 'PREVOYANCE'],
  credit: ['PRET', 'CREDIT', 'EMPRUNT', 'SOFINCO', 'COFIDIS', 'CETELEM'],
  abonnement: ['NETFLIX', 'SPOTIFY', 'AMAZON PRIME', 'DISNEY', 'CANAL', 'SFR', 'ORANGE', 'FREE', 'BOUYGUES', 'SOSH', 'FIBRE', 'INTERNET'],
  impot: ['IMPOT', 'TAXE', 'TRESOR PUBLIC', 'DGFIP', 'URSSAF'],
  transport: ['ESSENCE', 'CARBURANT', 'TOTAL ENERG', 'SNCF', 'RATP', 'NAVIGO', 'PARKING', 'PEAGE', 'AUTOROUTE', 'VINCI'],
  alimentation: ['CARREFOUR', 'LECLERC', 'AUCHAN', 'LIDL', 'ALDI', 'MONOPRIX', 'INTERMARCHE', 'PICARD', 'CASINO'],
  sante: ['PHARMACIE', 'MEDECIN', 'DENTISTE', 'MUTUELLE', 'CPAM', 'SECU', 'OPHTALMOL'],
  education: ['ECOLE', 'CRECHE', 'COLLEGE', 'LYCEE', 'UNIVERSITE', 'CANTINE', 'PERISCOLAIRE'],
  loisirs: ['SPORT', 'GYM', 'FITNESS', 'CINEMA', 'RESTAURANT', 'FNAC', 'DECATHLON'],
  enfants: ['PAMPERS', 'JOUET', 'KIABI', 'ORCHESTRA'],
}

function guessCategory(label) {
  for (const [category, keywords] of Object.entries(CATEGORY_PATTERNS)) {
    if (keywords.some((kw) => label.includes(kw))) return category
  }
  return 'autre'
}

export const useChargesStore = create(
  persist(
    (set, get) => ({
      fixedCharges: [],
      installmentPayments: [],
      plannedExpenses: [],
      categoryRules: {},

      addCategoryRule: (pattern, category) =>
        set((state) => ({
          categoryRules: { ...state.categoryRules, [pattern.toUpperCase()]: category },
        })),
      removeCategoryRule: (pattern) =>
        set((state) => {
          const next = { ...state.categoryRules }
          delete next[pattern.toUpperCase()]
          return { categoryRules: next }
        }),
      matchCategory: (label) => {
        const rules = get().categoryRules
        const upper = label.toUpperCase()
        for (const [pattern, category] of Object.entries(rules)) {
          if (upper.includes(pattern)) return category
        }
        return guessCategory(upper)
      },

      addFixedCharge: (charge) =>
        set((state) => ({
          fixedCharges: [...state.fixedCharges, { ...charge, id: generateId(), active: true }],
        })),
      updateFixedCharge: (id, updates) =>
        set((state) => ({
          fixedCharges: state.fixedCharges.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      removeFixedCharge: (id) =>
        set((state) => ({
          fixedCharges: state.fixedCharges.filter((c) => c.id !== id),
        })),
      toggleFixedCharge: (id) =>
        set((state) => ({
          fixedCharges: state.fixedCharges.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
        })),

      addInstallment: (payment) =>
        set((state) => ({
          installmentPayments: [
            ...state.installmentPayments,
            { ...payment, id: generateId(), createdAt: new Date().toISOString() },
          ],
        })),
      updateInstallment: (id, updates) =>
        set((state) => ({
          installmentPayments: state.installmentPayments.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      removeInstallment: (id) =>
        set((state) => ({
          installmentPayments: state.installmentPayments.filter((p) => p.id !== id),
        })),

      addPlannedExpense: (expense) =>
        set((state) => ({
          plannedExpenses: [...state.plannedExpenses, { ...expense, id: generateId() }],
        })),
      updatePlannedExpense: (id, updates) =>
        set((state) => ({
          plannedExpenses: state.plannedExpenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      removePlannedExpense: (id) =>
        set((state) => ({
          plannedExpenses: state.plannedExpenses.filter((e) => e.id !== id),
        })),
    }),
    { name: 'monest-charges', version: 1 }
  )
)
