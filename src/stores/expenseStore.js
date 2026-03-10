import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const generateId = () => crypto.randomUUID()

export const useExpenseStore = create(
  persist(
    (set, get) => ({
      expenses: [],

      addExpense: (expense) =>
        set((state) => ({
          expenses: [
            { ...expense, id: generateId(), createdAt: new Date().toISOString() },
            ...state.expenses,
          ],
        })),

      removeExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

      updateExpense: (id, updates) =>
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

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
