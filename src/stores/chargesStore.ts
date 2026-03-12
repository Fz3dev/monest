import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncToSupabase, deleteFromSupabase, syncCategoryRule, deleteCategoryRule } from '../lib/syncBridge'
import type { FixedCharge, InstallmentPayment, PlannedExpense } from '../types'

const generateId = (): string => crypto.randomUUID()

const CATEGORY_PATTERNS: Record<string, string[]> = {
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
  banque: ['COTISATION', 'FRAIS BANCAIRE', 'TENUE DE COMPTE', 'CARTE BANCAIRE', 'FORFAIT BOUQUET', 'AGIOS', 'COMMISSION INTERVENTION'],
}

function guessCategory(label: string): string {
  for (const [category, keywords] of Object.entries(CATEGORY_PATTERNS)) {
    if (keywords.some((kw) => label.includes(kw))) return category
  }
  return 'autre'
}

interface ChargesState {
  fixedCharges: FixedCharge[]
  installmentPayments: InstallmentPayment[]
  plannedExpenses: PlannedExpense[]
  categoryRules: Record<string, string>

  addCategoryRule: (pattern: string, category: string) => void
  removeCategoryRule: (pattern: string) => void
  matchCategory: (label: string) => string

  addFixedCharge: (charge: Omit<FixedCharge, 'id' | 'active' | 'createdAt' | 'updatedAt'>) => void
  updateFixedCharge: (id: string, updates: Partial<FixedCharge>) => void
  removeFixedCharge: (id: string) => void
  toggleFixedCharge: (id: string) => void

  addInstallment: (payment: Omit<InstallmentPayment, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateInstallment: (id: string, updates: Partial<InstallmentPayment>) => void
  removeInstallment: (id: string) => void

  addPlannedExpense: (expense: Omit<PlannedExpense, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePlannedExpense: (id: string, updates: Partial<PlannedExpense>) => void
  removePlannedExpense: (id: string) => void
}

export const useChargesStore = create<ChargesState>()(
  persist(
    (set, get) => ({
      fixedCharges: [],
      installmentPayments: [],
      plannedExpenses: [],
      categoryRules: {},

      addCategoryRule: (pattern: string, category: string) => {
        set((state) => ({
          categoryRules: { ...state.categoryRules, [pattern.toUpperCase()]: category },
        }))
        syncCategoryRule(pattern, category)
      },
      removeCategoryRule: (pattern: string) => {
        set((state) => {
          const next = { ...state.categoryRules }
          delete next[pattern.toUpperCase()]
          return { categoryRules: next }
        })
        deleteCategoryRule(pattern)
      },
      matchCategory: (label: string): string => {
        const rules = get().categoryRules
        const upper = label.toUpperCase()
        for (const [pattern, category] of Object.entries(rules)) {
          if (upper.includes(pattern)) return category
        }
        return guessCategory(upper)
      },

      addFixedCharge: (charge) => {
        const now = new Date().toISOString()
        const newCharge: FixedCharge = { ...charge, id: generateId(), active: true, createdAt: now, updatedAt: now }
        set((state) => ({
          fixedCharges: [...state.fixedCharges, newCharge],
        }))
        syncToSupabase('fixed_charges', newCharge)
      },
      updateFixedCharge: (id: string, updates: Partial<FixedCharge>) => {
        set((state) => ({
          fixedCharges: state.fixedCharges.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)),
        }))
        const updated = get().fixedCharges.find((c) => c.id === id)
        if (updated) syncToSupabase('fixed_charges', updated)
      },
      removeFixedCharge: (id: string) => {
        set((state) => ({
          fixedCharges: state.fixedCharges.filter((c) => c.id !== id),
        }))
        deleteFromSupabase('fixed_charges', id)
      },
      toggleFixedCharge: (id: string) => {
        set((state) => ({
          fixedCharges: state.fixedCharges.map((c) => (c.id === id ? { ...c, active: !c.active, updatedAt: new Date().toISOString() } : c)),
        }))
        const updated = get().fixedCharges.find((c) => c.id === id)
        if (updated) syncToSupabase('fixed_charges', updated)
      },

      addInstallment: (payment) => {
        const now = new Date().toISOString()
        const newPayment: InstallmentPayment = { ...payment, id: generateId(), createdAt: now, updatedAt: now }
        set((state) => ({
          installmentPayments: [...state.installmentPayments, newPayment],
        }))
        syncToSupabase('installment_payments', newPayment)
      },
      updateInstallment: (id: string, updates: Partial<InstallmentPayment>) => {
        set((state) => ({
          installmentPayments: state.installmentPayments.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)),
        }))
        const updated = get().installmentPayments.find((p) => p.id === id)
        if (updated) syncToSupabase('installment_payments', updated)
      },
      removeInstallment: (id: string) => {
        set((state) => ({
          installmentPayments: state.installmentPayments.filter((p) => p.id !== id),
        }))
        deleteFromSupabase('installment_payments', id)
      },

      addPlannedExpense: (expense) => {
        const now = new Date().toISOString()
        const newExpense: PlannedExpense = { ...expense, id: generateId(), createdAt: now, updatedAt: now }
        set((state) => ({
          plannedExpenses: [...state.plannedExpenses, newExpense],
        }))
        syncToSupabase('planned_expenses', newExpense)
      },
      updatePlannedExpense: (id: string, updates: Partial<PlannedExpense>) => {
        set((state) => ({
          plannedExpenses: state.plannedExpenses.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e)),
        }))
        const updated = get().plannedExpenses.find((e) => e.id === id)
        if (updated) syncToSupabase('planned_expenses', updated)
      },
      removePlannedExpense: (id: string) => {
        set((state) => ({
          plannedExpenses: state.plannedExpenses.filter((e) => e.id !== id),
        }))
        deleteFromSupabase('planned_expenses', id)
      },
    }),
    {
      name: 'monest-charges',
      version: 1,
      migrate: (state) => state as ChargesState,
    }
  )
)
