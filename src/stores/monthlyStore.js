import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'

export const useMonthlyStore = create(
  persist(
    (set, get) => ({
      entries: {},

      getEntry: (month) => {
        const key = typeof month === 'string' ? month : format(month, 'yyyy-MM')
        return get().entries[key] || null
      },

      setEntry: (month, data) =>
        set((state) => ({
          entries: {
            ...state.entries,
            [month]: { ...state.entries[month], ...data, month },
          },
        })),

      updateVariable: (month, chargeId, amount) =>
        set((state) => {
          const entry = state.entries[month] || { month }
          const overrides = entry.variableOverrides || {}
          return {
            entries: {
              ...state.entries,
              [month]: {
                ...entry,
                variableOverrides: { ...overrides, [chargeId]: amount },
              },
            },
          }
        }),
    }),
    { name: 'monest-monthly', version: 1 }
  )
)
