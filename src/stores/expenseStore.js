import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncToSupabase, deleteFromSupabase } from '../lib/syncBridge'

const generateId = () => crypto.randomUUID()

export const useExpenseStore = create(
  persist(
    (set, get) => ({
      expenses: [],

      addExpense: (expense) => {
        const now = new Date().toISOString()
        const newExpense = { ...expense, id: generateId(), createdAt: now, updatedAt: now }
        set((state) => ({
          expenses: [newExpense, ...state.expenses],
        }))
        syncToSupabase('expenses', newExpense)
      },

      removeExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        }))
        deleteFromSupabase('expenses', id)
      },

      updateExpense: (id, updates) => {
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e)),
        }))
        const updated = get().expenses.find((e) => e.id === id)
        if (updated) syncToSupabase('expenses', updated)
      },

      getExpensesByMonth: (month) =>
        get().expenses.filter((e) => e.date?.startsWith(month)),

      getExpensesByCategory: (month) => {
        const monthExpenses = get().expenses.filter((e) => e.date?.startsWith(month))
        const cats = {}
        monthExpenses.forEach((e) => {
          const key = e.category || 'autre'
          cats[key] = (cats[key] || 0) + e.amount
        })
        return cats
      },

      getTotalByMonth: (month) =>
        get()
          .expenses.filter((e) => e.date?.startsWith(month))
          .reduce((sum, e) => sum + e.amount, 0),
    }),
    { name: 'monest-expenses', version: 1 }
  )
)
