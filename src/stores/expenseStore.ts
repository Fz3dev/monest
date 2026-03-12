import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncToSupabase, deleteFromSupabase } from '../lib/syncBridge'
import type { Expense } from '../types'

const generateId = (): string => crypto.randomUUID()

interface ExpenseState {
  expenses: Expense[]

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void
  removeExpense: (id: string) => void
  updateExpense: (id: string, updates: Partial<Expense>) => void
  getExpensesByMonth: (month: string) => Expense[]
  getExpensesByCategory: (month: string) => Record<string, number>
  getTotalByMonth: (month: string) => number
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],

      addExpense: (expense) => {
        const now = new Date().toISOString()
        const newExpense: Expense = { ...expense, id: generateId(), createdAt: now, updatedAt: now }
        set((state) => ({
          expenses: [newExpense, ...state.expenses],
        }))
        syncToSupabase('expenses', newExpense)
      },

      removeExpense: (id: string) => {
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        }))
        deleteFromSupabase('expenses', id)
      },

      updateExpense: (id: string, updates: Partial<Expense>) => {
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e)),
        }))
        const updated = get().expenses.find((e) => e.id === id)
        if (updated) syncToSupabase('expenses', updated)
      },

      getExpensesByMonth: (month: string): Expense[] =>
        get().expenses.filter((e) => e.date?.startsWith(month)),

      getExpensesByCategory: (month: string): Record<string, number> => {
        const monthExpenses = get().expenses.filter((e) => e.date?.startsWith(month))
        const cats: Record<string, number> = {}
        monthExpenses.forEach((e) => {
          const key = e.category || 'autre'
          cats[key] = (cats[key] || 0) + e.amount
        })
        return cats
      },

      getTotalByMonth: (month: string): number =>
        get()
          .expenses.filter((e) => e.date?.startsWith(month))
          .reduce((sum, e) => sum + e.amount, 0),
    }),
    {
      name: 'monest-expenses',
      version: 1,
      migrate: (state) => state as ExpenseState,
    }
  )
)
